import asyncio
import sqlite3
import unittest
from contextlib import contextmanager
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

import server
from fastapi import HTTPException


class StoreCreditTests(unittest.TestCase):
    def setUp(self):
        self.connection = sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys=ON")
        self.connection.executescript(
            """
            CREATE TABLE customers (
                email TEXT PRIMARY KEY,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                balance_credits INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
            CREATE TABLE store_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                price_credits INTEGER NOT NULL,
                stock INTEGER NOT NULL,
                per_user_limit INTEGER NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE store_purchases (
                id TEXT PRIMARY KEY,
                customer_email TEXT NOT NULL REFERENCES customers(email),
                product_id INTEGER REFERENCES store_products(id),
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price_credits INTEGER NOT NULL,
                total_credits INTEGER NOT NULL,
                purchased_at TEXT NOT NULL
            );
            CREATE TABLE store_wallet_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_email TEXT NOT NULL REFERENCES customers(email),
                purchase_id TEXT UNIQUE REFERENCES store_purchases(id),
                amount_credits INTEGER NOT NULL,
                balance_after_credits INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );
            INSERT INTO customers (email, password_salt, password_hash, balance_credits, created_at)
            VALUES ('buyer@example.test', 'salt', 'hash', 0.30, '2026-10-25T00:00:00+00:00');
            """
        )
        self.connection.commit()

    def tearDown(self):
        self.connection.close()

    @contextmanager
    def fake_store_connection(self):
        yield self.connection

    def test_normalizes_decimal_credit_amounts_and_rejects_extra_precision(self):
        self.assertEqual(server.normalize_credit_amount("0.25"), Decimal("0.25"))
        with self.assertRaises(HTTPException):
            server.normalize_credit_amount("0.251")

    def test_product_create_accepts_fractional_price(self):
        body = server.StoreProductBody(
            name="Sample product",
            price_credits=Decimal("0.25"),
            stock=1,
            per_user_limit=1,
        )
        with patch.object(server, "store_connection", self.fake_store_connection):
            result = asyncio.run(server.store_admin_create_product(body))
        saved = self.connection.execute(
            "SELECT price_credits FROM store_products WHERE id=?",
            (result["id"],),
        ).fetchone()[0]
        self.assertAlmostEqual(float(saved), 0.25)

    def test_purchase_deducts_fractional_credits_from_existing_integer_affinity_schema(self):
        self.connection.execute(
            """INSERT INTO store_products
               (name, category, description, price_credits, stock, per_user_limit, created_at, updated_at)
               VALUES ('Sample product', '', '', 0.25, 1, 1, 'now', 'now')"""
        )
        self.connection.commit()
        request = SimpleNamespace(cookies={})
        with (
            patch.object(server, "store_connection", self.fake_store_connection),
            patch.object(
                server,
                "read_session_token",
                return_value={"username": "buyer@example.test"},
            ),
        ):
            result = asyncio.run(
                server.store_purchase(server.StorePurchaseBody(product_id=1), request)
            )
        balance = self.connection.execute(
            "SELECT balance_credits FROM customers WHERE email='buyer@example.test'"
        ).fetchone()[0]
        ledger_amount = self.connection.execute(
            "SELECT amount_credits FROM store_wallet_ledger WHERE purchase_id=?",
            (result["receipt_id"],),
        ).fetchone()[0]
        self.assertAlmostEqual(float(balance), 0.05)
        self.assertAlmostEqual(float(ledger_amount), -0.25)
        self.assertAlmostEqual(result["balance_credits"], 0.05)

    def test_admin_balance_credit_is_audited_and_supports_cents(self):
        body = server.BalanceAdjustmentBody(amount_credits=Decimal("0.25"))
        with patch.object(server, "store_connection", self.fake_store_connection):
            result = asyncio.run(
                server.store_admin_credit_customer("buyer@example.test", body)
            )
        balance = self.connection.execute(
            "SELECT balance_credits FROM customers WHERE email='buyer@example.test'"
        ).fetchone()[0]
        ledger = self.connection.execute(
            "SELECT amount_credits, balance_after_credits, purchase_id FROM store_wallet_ledger"
        ).fetchone()
        self.assertAlmostEqual(float(balance), 0.55)
        self.assertAlmostEqual(float(ledger["amount_credits"]), 0.25)
        self.assertAlmostEqual(float(ledger["balance_after_credits"]), 0.55)
        self.assertIsNone(ledger["purchase_id"])
        self.assertAlmostEqual(result["balance_credits"], 0.55)


if __name__ == "__main__":
    unittest.main()
