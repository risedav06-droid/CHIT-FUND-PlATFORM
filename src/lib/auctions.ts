const moneyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export type AuctionPrizeCalculation = {
  grossPrizeAmount: number;
  discountAmount: number;
  netPrizeAmount: number;
  dividendAmount: number;
};

export function calculateAuctionPrize(
  grossPrizeAmount: number,
  discountAmount: number,
  ticketCount: number,
): AuctionPrizeCalculation {
  if (ticketCount <= 0) {
    throw new Error("Ticket count must be greater than zero.");
  }

  if (discountAmount < 0) {
    throw new Error("Discount amount cannot be negative.");
  }

  if (discountAmount >= grossPrizeAmount) {
    throw new Error("Discount amount must be less than the gross prize amount.");
  }

  return {
    grossPrizeAmount: roundMoney(grossPrizeAmount),
    discountAmount: roundMoney(discountAmount),
    netPrizeAmount: roundMoney(grossPrizeAmount - discountAmount),
    dividendAmount: roundMoney(discountAmount / ticketCount),
  };
}

export function formatAuctionCalculation(calculation: AuctionPrizeCalculation) {
  return [
    `Gross ${moneyFormatter.format(calculation.grossPrizeAmount)}`,
    `Discount ${moneyFormatter.format(calculation.discountAmount)}`,
    `Net ${moneyFormatter.format(calculation.netPrizeAmount)}`,
    `Dividend ${moneyFormatter.format(calculation.dividendAmount)}`,
  ].join(" | ");
}
