export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;

  const monthCandidate = Number(digits.slice(2, 4));

  if (digits.length <= 4) {
    return monthCandidate >= 1 && monthCandidate <= 12
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatTicketDate(date: string) {
  if (!date) return "Sem data";
  if (/^\d{4}$/.test(date)) return date;

  const brDateMatch = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    const ticketDate = new Date(`${year}-${month}-${day}T00:00:00`);
    const formattedMonth = new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(ticketDate)
      .replace(".", "");

    return `${day}/${formattedMonth}/${year}`;
  }

  const ticketDate = new Date(`${date}T00:00:00`);
  const isYearOnlyDate = ticketDate.getDate() === 1 && ticketDate.getMonth() === 0;

  if (isYearOnlyDate) return String(ticketDate.getFullYear());

  const day = String(ticketDate.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(ticketDate)
    .replace(".", "");
  const year = ticketDate.getFullYear();

  return `${day}/${month}/${year}`;
}

export function getDateInputValue(storedDate?: string) {
  if (storedDate) {
    const normalizedDate = storedDate.slice(0, 10);
    const yearOnlyDateMatch = normalizedDate.match(/^(\d{4})-01-01$/);
    const isoDateMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (yearOnlyDateMatch) return yearOnlyDateMatch[1];
    if (isoDateMatch) return `${isoDateMatch[3]}/${isoDateMatch[2]}/${isoDateMatch[1]}`;

    return normalizedDate;
  }

  return new Date().toLocaleDateString("pt-BR");
}

export function toSupabaseDate(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) return null;
  if (/^\d{4}$/.test(trimmedValue)) return `${trimmedValue}-01-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) return trimmedValue;

  const brDateMatch = trimmedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!brDateMatch) return trimmedValue;

  const [, day, month, year] = brDateMatch;

  return `${year}-${month}-${day}`;
}
