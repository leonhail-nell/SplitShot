"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMoney } from "@/lib/format";
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
  const [tax, setTax] = useState(initial.tax);
  const [tip, setTip] = useState(initial.tip);
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
  const [peers, setPeers] = useState(initial.peers);
  const [fxNote, setFxNote] = useState(initial.fxNote);
  const [displayTotals, setDisplayTotals] = useState(initial.displayTotals);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedOwe, setCopiedOwe] = useState<string | null>(null);
  const [newPerson, setNewPerson] = useState("");
  const [presenceName, setPresenceName] = useState("Guest");
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [hydratedDefaults, setHydratedDefaults] = useState(
    initial.people.length > 0,
  );
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const versionRef = useRef(initial.version);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const localTotals = useMemo(
    () => computeTotals(items, people, tax, tip),
    [items, people, tax, tip],
  );

  const applyRemote = useCallback((payload: SessionPayload) => {
    setMerchant(payload.merchant ?? "");
    setCurrency(payload.currency);
    setDisplayCurrency(payload.displayCurrency || payload.currency);
    setTax(payload.tax);
    setTip(payload.tip);
    setItems(payload.items);
    setPeople(payload.people);
    setVersion(payload.version);
    setPeers(payload.peers);
    setFxNote(payload.fxNote);
    setDisplayTotals(payload.displayTotals);
    dirtyRef.current = false;
  }, []);

  const persist = useCallback(
    async (snapshot: {
      merchant: string;
      currency: string;
      displayCurrency: string;
      tax: number;
      tip: number;
      items: SessionItem[];
      people: SessionPerson[];
    }) => {
      savingRef.current = true;
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`/api/sessions/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: versionRef.current,
            merchant: snapshot.merchant.trim() ? snapshot.merchant : null,
            currency: snapshot.currency,
            displayCurrency: snapshot.displayCurrency,
            tax: snapshot.tax,
            tip: snapshot.tip,
            items: snapshot.items,
            people: snapshot.people,
          }),
        });
        const payload = await res.json();
        if (res.status === 409 && payload.session) {
          applyRemote(payload.session as SessionPayload);
          setSaveError("Updated from another editor");
          return;
        }
        if (!res.ok) {
          throw new Error(payload.error ?? "Save failed");
        }
        const session = payload as SessionPayload;
        setVersion(session.version);
        versionRef.current = session.version;
        setPeers(session.peers);
        setFxNote(session.fxNote);
        setDisplayTotals(session.displayTotals);
        dirtyRef.current = false;
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed");
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [applyRemote, initial.id],
  );

  useEffect(() => {
    void fetch("/api/config")
      .then((r) => r.json())
      .then((d: { stripeEnabled?: boolean }) =>
        setStripeEnabled(Boolean(d.stripeEnabled)),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydratedDefaults) return;
    setHydratedDefaults(true);
    dirtyRef.current = true;
    void persist({
      merchant,
      currency,
      displayCurrency,
      tax,
      tip,
      items,
      people,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed defaults once
  }, [hydratedDefaults]);

  useEffect(() => {
    if (!hydratedDefaults) return;
    dirtyRef.current = true;
    const timer = setTimeout(() => {
      void persist({
        merchant,
        currency,
        displayCurrency,
        tax,
        tip,
        items,
        people,
      });
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
    hydratedDefaults,
    persist,
  ]);

  // Live poll + presence
  useEffect(() => {
    const tick = async () => {
      try {
        await fetch(`/api/sessions/${initial.id}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientId.current,
            name: presenceName || "Guest",
          }),
        });

        if (dirtyRef.current || savingRef.current) return;

        const res = await fetch(`/api/sessions/${initial.id}`);
        if (!res.ok) return;
        const remote = (await res.json()) as SessionPayload;
        if (remote.version > version) {
          applyRemote(remote);
        } else {
          setPeers(remote.peers);
          setFxNote(remote.fxNote);
          setDisplayTotals(remote.displayTotals);
        }
      } catch {
        // ignore transient poll errors
      }
    };

    const id = window.setInterval(() => void tick(), 2000);
    void tick();
    return () => window.clearInterval(id);
  }, [applyRemote, initial.id, presenceName, version]);

  function updateItem(id: string, patch: Partial<SessionItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function toggleAssignee(itemId: string, personId: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const has = item.assigneeIds.includes(personId);
        return {
          ...item,
          assigneeIds: has
            ? item.assigneeIds.filter((id) => id !== personId)
            : [...item.assigneeIds, personId],
        };
      }),
    );
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setSaveError("Could not copy link");
    }
  }

  async function copyOwe(personId: string) {
    const row = displayTotals.byPerson.find((p) => p.personId === personId);
    const person = people.find((p) => p.id === personId);
    if (!row || !person) return;
    const text = `You owe ${formatMoney(row.total, displayCurrency)} for ${merchant || "our receipt"} (SplitShot)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOwe(personId);
      window.setTimeout(() => setCopiedOwe(null), 1600);
    } catch {
      setSaveError("Could not copy");
    }
  }

  async function checkout(personId: string) {
    setSaveError(null);
    try {
      const res = await fetch(`/api/sessions/${initial.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Checkout failed");
      if (payload.url) window.location.href = payload.url as string;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  const otherPeers = peers.filter((p) => p.clientId !== clientId.current);
  const shownTotals =
    displayCurrency === currency ? localTotals : displayTotals;

  return (
    <div className="editor">
      <header className="editor-top">
        <div>
          <p className="brand-mark">
            <a href="/">SplitShot</a>
          </p>
          <input
            className="merchant-input"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Merchant name"
            aria-label="Merchant name"
          />
          <div className="live-row">
            <span className="live-pill">
              Live
              {otherPeers.length > 0
                ? ` · ${otherPeers.map((p) => p.name).join(", ")}`
                : " · just you"}
            </span>
            <input
              className="presence-name"
              value={presenceName}
              onChange={(e) => setPresenceName(e.target.value)}
              aria-label="Your display name"
              placeholder="Your name"
            />
          </div>
        </div>
        <div className="editor-actions">
          <span className={`save-pill ${saving ? "is-saving" : ""}`}>
            {saving ? "Saving…" : "Saved"}
          </span>
          <button type="button" className="share-btn" onClick={copyShareLink}>
            {copied ? "Link copied" : "Copy share link"}
          </button>
        </div>
      </header>

      {saveError && (
        <p className="form-error" role="alert">
          {saveError}
        </p>
      )}

      <section className="people-block">
        <h2>Who&apos;s splitting</h2>
        <div className="people-row">
          {people.map((person) => (
            <div key={person.id} className="person-chip">
              <input
                value={person.name}
                aria-label="Person name"
                onChange={(e) =>
                  setPeople((prev) =>
                    prev.map((p) =>
                      p.id === person.id
                        ? { ...p, name: e.target.value }
                        : p,
                    ),
                  )
                }
              />
              <button
                type="button"
                className={`paid-toggle ${person.paid ? "is-paid" : ""}`}
                onClick={() =>
                  setPeople((prev) =>
                    prev.map((p) =>
                      p.id === person.id ? { ...p, paid: !p.paid } : p,
                    ),
                  )
                }
              >
                {person.paid ? "Paid" : "Unpaid"}
              </button>
              <button
                type="button"
                className="chip-x"
                onClick={() => {
                  setPeople((prev) => prev.filter((p) => p.id !== person.id));
                  setItems((prev) =>
                    prev.map((item) => ({
                      ...item,
                      assigneeIds: item.assigneeIds.filter(
                        (pid) => pid !== person.id,
                      ),
                    })),
                  );
                }}
                aria-label={`Remove ${person.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <form
          className="add-person"
          onSubmit={(e) => {
            e.preventDefault();
            const name = newPerson.trim();
            if (!name) return;
            setPeople((prev) => [
              ...prev,
              { id: nanoid(10), name, paid: false },
            ]);
            setNewPerson("");
          }}
        >
          <input
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
            placeholder="Add a person"
            aria-label="Add a person"
          />
          <button type="submit">Add</button>
        </form>
      </section>

      <section className="receipt-sheet">
        <div className="sheet-meta sheet-meta-4">
          <label>
            Currency
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
            />
          </label>
          <label>
            Display as
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
            >
              {Array.from(
                new Set([currency, displayCurrency, ...DISPLAY_CURRENCIES]),
              ).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tax
            <input
              type="number"
              min={0}
              step="0.01"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Tip
            <input
              type="number"
              min={0}
              step="0.01"
              value={tip}
              onChange={(e) => setTip(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        {fxNote ? <p className="fx-note">{fxNote}</p> : null}

        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className="item-row">
              <div className="item-fields">
                <input
                  className="item-name"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  aria-label="Item name"
                />
                <input
                  className="item-qty"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, {
                      quantity: Number(e.target.value) || 1,
                    })
                  }
                  aria-label="Quantity"
                />
                <input
                  className="item-price"
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) =>
                    updateItem(item.id, {
                      price: Number(e.target.value) || 0,
                    })
                  }
                  aria-label="Price"
                />
                <button
                  type="button"
                  className="item-remove"
                  onClick={() =>
                    setItems((prev) => prev.filter((i) => i.id !== item.id))
                  }
                  aria-label="Remove item"
                >
                  Remove
                </button>
              </div>
              <div className="assign-row">
                {people.map((person) => {
                  const active = item.assigneeIds.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      className={`assign-chip ${active ? "is-on" : ""}`}
                      onClick={() => toggleAssignee(item.id, person.id)}
                    >
                      {person.name}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="ghost-btn"
          onClick={() =>
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
          + Add item
        </button>
      </section>

      <aside className="totals-bar" aria-label="Split totals">
        <div className="totals-summary">
          <div>
            <span>Items</span>
            <strong>
              {formatMoney(shownTotals.itemsSubtotal, displayCurrency)}
            </strong>
          </div>
          <div>
            <span>Tax + tip</span>
            <strong>
              {formatMoney(shownTotals.tax + shownTotals.tip, displayCurrency)}
            </strong>
          </div>
          <div className="grand">
            <span>Total</span>
            <strong className="count-up">
              {formatMoney(shownTotals.grandTotal, displayCurrency)}
            </strong>
          </div>
        </div>

        <ul className="person-totals">
          {shownTotals.byPerson.map((row) => {
            const person = people.find((p) => p.id === row.personId);
            return (
              <li key={row.personId}>
                <span>
                  {row.name}
                  {person?.paid ? " · paid" : ""}
                </span>
                <span className="person-total-actions">
                  <strong>{formatMoney(row.total, displayCurrency)}</strong>
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() => void copyOwe(row.personId)}
                  >
                    {copiedOwe === row.personId ? "Copied" : "Copy owe"}
                  </button>
                  {stripeEnabled && !person?.paid ? (
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => void checkout(row.personId)}
                    >
                      Pay
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>

        {shownTotals.unassignedSubtotal > 0 && (
          <p className="muted unassigned">
            Unassigned:{" "}
            {formatMoney(shownTotals.unassignedSubtotal, displayCurrency)}
          </p>
        )}
      </aside>
    </div>
  );
}
