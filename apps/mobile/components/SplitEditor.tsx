import { avatarTone, personInitials } from "@splitshot/shared";
import { nanoid } from "nanoid/non-secure";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createCheckout,
  fetchConfig,
  getSession,
  postPresence,
  updateSession,
} from "@/lib/api";
import { WEB_URL } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import { colors, fonts, type } from "@/lib/theme";
import { computeTotals } from "@/lib/totals";
import type { SessionItem, SessionPayload, SessionPerson } from "@/lib/types";

type Props = {
  initial: SessionPayload;
};

const DISPLAY_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "PHP"];

export function SplitEditor({ initial }: Props) {
  const clientId = useRef(nanoid(10));
  const [merchant, setMerchant] = useState(initial.merchant ?? "");
  const [currency, setCurrency] = useState(initial.currency);
  const [displayCurrency, setDisplayCurrency] = useState(
    initial.displayCurrency || initial.currency,
  );
  const [tax, setTax] = useState(String(initial.tax));
  const [tip, setTip] = useState(String(initial.tip));
  const [items, setItems] = useState<SessionItem[]>(initial.items);
  const [people, setPeople] = useState<SessionPerson[]>(
    initial.people.length > 0
      ? initial.people
      : [
          { id: nanoid(10), name: "You", paid: false },
          { id: nanoid(10), name: "Friend", paid: false },
        ],
  );
  const [version, setVersion] = useState(initial.version);
  const [peers, setPeers] = useState(initial.peers ?? []);
  const [fxNote, setFxNote] = useState(initial.fxNote);
  const [displayTotals, setDisplayTotals] = useState(
    initial.displayTotals ?? initial.totals,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newPerson, setNewPerson] = useState("");
  const [presenceName, setPresenceName] = useState("Guest");
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [copiedOwe, setCopiedOwe] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(initial.people.length > 0);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const versionRef = useRef(initial.version);

  const taxNum = Number(tax) || 0;
  const tipNum = Number(tip) || 0;

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const localTotals = useMemo(
    () => computeTotals(items, people, taxNum, tipNum),
    [items, people, taxNum, tipNum],
  );

  const applyRemote = useCallback((payload: SessionPayload) => {
    setMerchant(payload.merchant ?? "");
    setCurrency(payload.currency);
    setDisplayCurrency(payload.displayCurrency || payload.currency);
    setTax(String(payload.tax));
    setTip(String(payload.tip));
    setItems(payload.items);
    setPeople(payload.people);
    setVersion(payload.version);
    versionRef.current = payload.version;
    setPeers(payload.peers ?? []);
    setFxNote(payload.fxNote);
    setDisplayTotals(payload.displayTotals ?? payload.totals);
    dirtyRef.current = false;
  }, []);

  const persist = useCallback(async () => {
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const session = await updateSession(initial.id, {
        version: versionRef.current,
        merchant: merchant.trim() ? merchant : null,
        currency,
        displayCurrency,
        tax: taxNum,
        tip: tipNum,
        items,
        people,
      });
      setVersion(session.version);
      versionRef.current = session.version;
      setPeers(session.peers ?? []);
      setFxNote(session.fxNote);
      setDisplayTotals(session.displayTotals ?? session.totals);
      dirtyRef.current = false;
    } catch (err) {
      const conflict = err as Error & { session?: SessionPayload };
      if (conflict.message === "Version conflict" && conflict.session) {
        applyRemote(conflict.session);
        setSaveError("Updated from another editor");
      } else {
        setSaveError(err instanceof Error ? err.message : "Save failed");
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [
    applyRemote,
    currency,
    displayCurrency,
    initial.id,
    items,
    merchant,
    people,
    taxNum,
    tipNum,
  ]);

  useEffect(() => {
    void fetchConfig()
      .then((c) => setStripeEnabled(Boolean(c.stripeEnabled)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydrated) return;
    setHydrated(true);
    dirtyRef.current = true;
    void persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    dirtyRef.current = true;
    const timer = setTimeout(() => {
      void persist();
    }, 450);
    return () => clearTimeout(timer);
  }, [
    merchant,
    currency,
    displayCurrency,
    tax,
    tip,
    items,
    people,
    hydrated,
    persist,
  ]);

  useEffect(() => {
    const tick = async () => {
      try {
        await postPresence(initial.id, {
          clientId: clientId.current,
          name: presenceName || "Guest",
        });
        if (dirtyRef.current || savingRef.current) return;
        const remote = await getSession(initial.id);
        if (remote.version > versionRef.current) {
          applyRemote(remote);
        } else {
          setPeers(remote.peers ?? []);
          setFxNote(remote.fxNote);
          setDisplayTotals(remote.displayTotals ?? remote.totals);
        }
      } catch {
        // ignore poll errors
      }
    };
    const id = setInterval(() => void tick(), 2000);
    void tick();
    return () => clearInterval(id);
  }, [applyRemote, initial.id, presenceName]);

  const shownTotals =
    displayCurrency === currency ? localTotals : displayTotals;
  const otherPeers = peers.filter((p) => p.clientId !== clientId.current);

  async function shareLink() {
    try {
      await Share.share({
        message: `Split this receipt on SplitShot: ${WEB_URL}/s/${initial.id}`,
        url: `${WEB_URL}/s/${initial.id}`,
      });
    } catch {
      setSaveError("Could not open the share sheet");
    }
  }

  async function copyOwe(personId: string) {
    const row = shownTotals.byPerson.find((p) => p.personId === personId);
    if (!row) return;
    const text = `You owe ${formatMoney(row.total, displayCurrency)} for ${merchant || "our receipt"} (SplitShot)`;
    try {
      await Share.share({ message: text });
      setCopiedOwe(personId);
      setTimeout(() => setCopiedOwe(null), 1600);
    } catch {
      setSaveError("Could not share owe text");
    }
  }

  async function checkout(personId: string) {
    try {
      const { url } = await createCheckout(initial.id, personId);
      await Linking.openURL(url);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Text style={styles.savePill}>{saving ? "Saving…" : "Saved"}</Text>
          <Pressable style={styles.shareBtn} onPress={() => void shareLink()}>
            <Text style={styles.shareLabel}>Share</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.merchant}
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Merchant name"
          placeholderTextColor="#6b7f76"
        />

        <View style={styles.liveRow}>
          <Text style={styles.livePill}>
            Live
            {otherPeers.length > 0
              ? ` · ${otherPeers.map((p) => p.name).join(", ")}`
              : " · just you"}
          </Text>
          <TextInput
            style={styles.presenceName}
            value={presenceName}
            onChangeText={setPresenceName}
            placeholder="Your name"
            placeholderTextColor="#6b7f76"
          />
        </View>

        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        <Text style={styles.sectionTitle}>Who&apos;s splitting</Text>
        <View style={styles.peopleRow}>
          {people.map((person) => (
            <View key={person.id} style={styles.personChip}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: avatarTone(person.id) },
                ]}
              >
                <Text style={styles.avatarText}>
                  {personInitials(person.name)}
                </Text>
              </View>
              <TextInput
                style={styles.personInput}
                value={person.name}
                onChangeText={(name) =>
                  setPeople((prev) =>
                    prev.map((p) =>
                      p.id === person.id ? { ...p, name } : p,
                    ),
                  )
                }
              />
              <Pressable
                onPress={() =>
                  setPeople((prev) =>
                    prev.map((p) =>
                      p.id === person.id ? { ...p, paid: !p.paid } : p,
                    ),
                  )
                }
              >
                <Text
                  style={[styles.paidToggle, person.paid && styles.paidOn]}
                >
                  {person.paid ? "Paid" : "Unpaid"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setPeople((prev) => prev.filter((p) => p.id !== person.id));
                  setItems((prev) =>
                    prev.map((item) => ({
                      ...item,
                      assigneeIds: item.assigneeIds.filter(
                        (id) => id !== person.id,
                      ),
                    })),
                  );
                }}
              >
                <Text style={styles.chipX}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.addPerson}>
          <TextInput
            style={styles.addInput}
            value={newPerson}
            onChangeText={setNewPerson}
            placeholder="Add a person"
            placeholderTextColor="#6b7f76"
          />
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              const name = newPerson.trim();
              if (!name) return;
              setPeople((prev) => [
                ...prev,
                { id: nanoid(10), name, paid: false },
              ]);
              setNewPerson("");
            }}
          >
            <Text style={styles.addBtnLabel}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <View style={styles.metaRow}>
            <MetaField
              label="Currency"
              value={currency}
              onChangeText={(v) => setCurrency(v.toUpperCase())}
            />
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>Display</Text>
              <View style={styles.currencyWrap}>
                {Array.from(
                  new Set([currency, displayCurrency, ...DISPLAY_CURRENCIES]),
                )
                  .slice(0, 6)
                  .map((code) => (
                    <Pressable
                      key={code}
                      style={[
                        styles.currencyChip,
                        displayCurrency === code && styles.currencyOn,
                      ]}
                      onPress={() => setDisplayCurrency(code)}
                    >
                      <Text
                        style={[
                          styles.currencyLabel,
                          displayCurrency === code && styles.currencyLabelOn,
                        ]}
                      >
                        {code}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          </View>
          <View style={styles.metaRow}>
            <MetaField
              label="Tax"
              value={tax}
              onChangeText={setTax}
              keyboardType="decimal-pad"
            />
            <MetaField
              label="Tip"
              value={tip}
              onChangeText={setTip}
              keyboardType="decimal-pad"
            />
          </View>
          {fxNote ? <Text style={styles.fxNote}>{fxNote}</Text> : null}

          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <TextInput
                style={styles.itemName}
                value={item.name}
                onChangeText={(name) =>
                  setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, name } : i)),
                  )
                }
              />
              <View style={styles.itemNums}>
                <TextInput
                  style={styles.numInput}
                  value={String(item.quantity)}
                  keyboardType="decimal-pad"
                  onChangeText={(v) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === item.id
                          ? { ...i, quantity: Number(v) || 1 }
                          : i,
                      ),
                    )
                  }
                />
                <TextInput
                  style={styles.numInput}
                  value={String(item.price)}
                  keyboardType="decimal-pad"
                  onChangeText={(v) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === item.id
                          ? { ...i, price: Number(v) || 0 }
                          : i,
                      ),
                    )
                  }
                />
                <Pressable
                  onPress={() =>
                    setItems((prev) => prev.filter((i) => i.id !== item.id))
                  }
                >
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
              <View style={styles.assignRow}>
                {people.map((person) => {
                  const on = item.assigneeIds.includes(person.id);
                  return (
                    <Pressable
                      key={person.id}
                      style={[styles.assignChip, on && styles.assignOn]}
                      onPress={() =>
                        setItems((prev) =>
                          prev.map((i) => {
                            if (i.id !== item.id) return i;
                            const has = i.assigneeIds.includes(person.id);
                            return {
                              ...i,
                              assigneeIds: has
                                ? i.assigneeIds.filter((id) => id !== person.id)
                                : [...i.assigneeIds, person.id],
                            };
                          }),
                        )
                      }
                    >
                      <Text
                        style={[styles.assignLabel, on && styles.assignLabelOn]}
                      >
                        {person.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Pressable
            style={styles.ghostBtn}
            onPress={() =>
              setItems((prev) => [
                ...prev,
                {
                  id: nanoid(10),
                  name: "New item",
                  price: 0,
                  quantity: 1,
                  assigneeIds: [],
                },
              ])
            }
          >
            <Text style={styles.ghostLabel}>+ Add item</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.totalsBar}>
        <View style={styles.totalsSummary}>
          <TotalCell
            label="Items"
            value={formatMoney(shownTotals.itemsSubtotal, displayCurrency)}
          />
          <TotalCell
            label="Tax + tip"
            value={formatMoney(
              shownTotals.tax + shownTotals.tip,
              displayCurrency,
            )}
          />
          <TotalCell
            label="Total"
            value={formatMoney(shownTotals.grandTotal, displayCurrency)}
            emphasize
          />
        </View>
        <ScrollView
          style={styles.totalsPeople}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {shownTotals.byPerson.map((row) => {
            const person = people.find((p) => p.id === row.personId);
            return (
              <View key={row.personId} style={styles.personTotal}>
                <Text style={styles.personTotalName}>
                  {row.name}
                  {person?.paid ? " · paid" : ""}
                </Text>
                <View style={styles.personActions}>
                  <Text style={styles.personTotalValue}>
                    {formatMoney(row.total, displayCurrency)}
                  </Text>
                  <Pressable onPress={() => void copyOwe(row.personId)}>
                    <Text style={styles.miniBtn}>
                      {copiedOwe === row.personId ? "Sent" : "Owe"}
                    </Text>
                  </Pressable>
                  {stripeEnabled && !person?.paid ? (
                    <Pressable onPress={() => void checkout(row.personId)}>
                      <Text style={styles.miniBtn}>Pay</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function MetaField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "decimal-pad";
}) {
  return (
    <View style={styles.metaField}>
      <Text style={styles.metaLabel}>{label}</Text>
      <TextInput
        style={styles.metaInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function TotalCell({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.totalCell}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, emphasize && styles.totalEmphasize]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  scrollView: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 20 },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  savePill: {
    fontFamily: fonts.sans.regular,
    color: colors.inkSoft,
    opacity: 0.75,
    fontSize: 13,
  },
  shareBtn: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shareLabel: { ...type.buttonOnInk },
  merchant: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 8,
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.ink,
    textAlign: "center",
  },
  liveRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  livePill: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    backgroundColor: "rgba(13,110,110,0.12)",
    color: colors.accentDeep,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  presenceName: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 100,
    fontFamily: fonts.sans.regular,
    color: colors.ink,
    backgroundColor: "rgba(247,248,244,0.7)",
  },
  error: { ...type.error, marginBottom: 10, textAlign: "center" },
  sectionTitle: {
    ...type.section,
    marginBottom: 10,
    textAlign: "center",
  },
  peopleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  personChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(247,248,244,0.8)",
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 4,
    gap: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.sans.bold,
    fontSize: 11,
    color: colors.onAccent,
    letterSpacing: 0.3,
  },
  personInput: {
    minWidth: 64,
    maxWidth: 100,
    fontFamily: fonts.sans.regular,
    color: colors.ink,
    paddingVertical: 4,
  },
  paidToggle: {
    fontFamily: fonts.sans.regular,
    fontSize: 11,
    color: colors.inkSoft,
    paddingHorizontal: 4,
  },
  paidOn: {
    fontFamily: fonts.sans.bold,
    color: colors.accentDeep,
  },
  chipX: {
    fontFamily: fonts.sans.regular,
    fontSize: 18,
    color: colors.inkSoft,
    paddingHorizontal: 6,
  },
  addPerson: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 18 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(247,248,244,0.7)",
    fontFamily: fonts.sans.regular,
    color: colors.ink,
  },
  addBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "rgba(247,248,244,0.72)",
  },
  addBtnLabel: { ...type.button },
  sheet: {
    backgroundColor: colors.sheet,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  metaField: { flexGrow: 1, flexBasis: "42%", minWidth: 120 },
  metaLabel: {
    ...type.metaLabel,
    marginBottom: 4,
  },
  metaInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    ...type.input,
  },
  currencyWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  currencyChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currencyOn: {
    backgroundColor: "rgba(13,110,110,0.14)",
    borderColor: "rgba(13,110,110,0.45)",
  },
  currencyLabel: {
    fontFamily: fonts.sans.regular,
    fontSize: 11,
    color: colors.ink,
  },
  currencyLabelOn: {
    fontFamily: fonts.sans.bold,
    color: colors.accentDeep,
  },
  fxNote: {
    fontFamily: fonts.sans.regular,
    color: colors.inkSoft,
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  itemCard: {
    borderTopWidth: 1,
    borderTopColor: "rgba(20,35,31,0.12)",
    paddingTop: 12,
    marginBottom: 10,
  },
  itemName: {
    fontFamily: fonts.sans.regular,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  itemNums: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  numInput: {
    width: 72,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontFamily: fonts.sans.regular,
    color: colors.ink,
  },
  remove: {
    fontFamily: fonts.sans.regular,
    color: colors.inkSoft,
    fontSize: 13,
  },
  assignRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  assignChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  assignOn: {
    backgroundColor: "rgba(13,110,110,0.14)",
    borderColor: "rgba(13,110,110,0.45)",
  },
  assignLabel: {
    fontFamily: fonts.sans.regular,
    color: colors.ink,
    fontSize: 13,
  },
  assignLabelOn: {
    fontFamily: fonts.sans.semibold,
    color: colors.accentDeep,
  },
  ghostBtn: {
    alignSelf: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(247,248,244,0.72)",
  },
  ghostLabel: { ...type.button },
  totalsBar: {
    marginHorizontal: 12,
    marginBottom: 12,
    maxHeight: "38%",
    backgroundColor: "rgba(20,35,31,0.94)",
    borderRadius: 16,
    padding: 14,
  },
  totalsPeople: {
    maxHeight: 140,
  },
  totalsSummary: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  totalCell: { flex: 1, minWidth: 72, alignItems: "center" },
  totalLabel: {
    fontFamily: fonts.sans.regular,
    color: colors.mutedOnDark,
    fontSize: 12,
    textAlign: "center",
  },
  totalValue: {
    fontFamily: fonts.sans.semibold,
    color: colors.totalsFg,
    marginTop: 2,
    textAlign: "center",
  },
  totalEmphasize: {
    ...type.displayEmphasize,
  },
  personTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(237,244,241,0.16)",
    marginTop: 6,
  },
  personTotalName: {
    fontFamily: fonts.sans.regular,
    color: colors.mutedOnDark,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 80,
  },
  personActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  personTotalValue: {
    fontFamily: fonts.sans.semibold,
    color: colors.totalsFg,
  },
  miniBtn: {
    fontFamily: fonts.sans.regular,
    color: colors.totalsFg,
    borderWidth: 1,
    borderColor: "rgba(237,244,241,0.28)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
  },
});
