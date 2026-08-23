"use client";

import { TransactionPage } from "../../../components/finance/transaction-page";

export default function ExpensesPage() {
  return (
    <TransactionPage
      direction="out"
      title="Gastos"
      createButtonClassName="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
      totalTextClassName="text-rose-400"
      totalLabel="Total gastos"
      emptyStateMessage="No hay gastos registrados"
      saveLabel="Guardar gasto"
      defaultKind="expense"
    />
  );
}
