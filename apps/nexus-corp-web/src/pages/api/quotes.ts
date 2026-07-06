export interface QuoteLeadPayload {
  name: string;
  email: string;
  phone: string;
  city: string;
  product: string;
  quoteType: string;
  amount: number;
  downPayment: number;
  financedAmount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  rateShown: string;
  contactPreference: string;
  acceptedTerms: boolean;
  resultStatus?: string;
}

export const sendQuoteWithLead = async (payload: QuoteLeadPayload) => {
  try {

    console.log('Esta es la data: ', payload);
    const response = await fetch("/api/quotes-with-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(`Error ${response.status} al enviar cotización:`, data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error de red al enviar cotización:", error);
    return null;
  }
};