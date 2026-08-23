"use client";

import { TransactionPage } from "../../../components/finance/transaction-page";

export default function IncomePage() {
  return (
    <TransactionPage
      direction="in"
      title="Ingresos"
      createButtonClassName="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
      totalTextClassName="text-emerald-400"
      totalLabel="Total ingresos"
      emptyStateMessage="No hay ingresos registrados"
      saveLabel="Guardar ingreso"
      defaultKind="client_income"
    />
  );
}
