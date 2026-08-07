-- CreateTable
CREATE TABLE "SplitSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "merchant" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tax" REAL NOT NULL DEFAULT 0,
    "tip" REAL NOT NULL DEFAULT 0,
    "imagePath" TEXT
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    CONSTRAINT "Item_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SplitSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Person_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SplitSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemAssignment" (
    "itemId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    PRIMARY KEY ("itemId", "personId"),
    CONSTRAINT "ItemAssignment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
