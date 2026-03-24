export const calculateEqualSplit = (amount, members) => {
  const share = Math.round((amount / members.length) * 100) / 100;

  const splits = members.map((userId) => ({ userId, share }));

  const total = share * members.length;
  const diff = Math.round((amount - total) * 100) / 100;

  if (diff !== 0) splits[splits.length - 1].share += diff;

  return splits;
};

export const calculateExactSplit = (values) => {
  // values: { userId: amount }
  return Object.entries(values).map(([userId, share]) => ({
    userId,
    share: Number(share),
  }));
};

export const calculatePercentageSplit = (amount, values) => {
  // values: { userId: percentage }
  return Object.entries(values).map(([userId, percent]) => ({
    userId,
    share: Math.round((amount * percent) / 100 * 100) / 100,
  }));
};

export const calculateRatioSplit = (amount, values) => {
  // values: { userId: ratio }
  const totalRatio = Object.values(values).reduce((a, b) => a + Number(b), 0);

  return Object.entries(values).map(([userId, ratio]) => ({
    userId,
    share: Math.round((amount * ratio) / totalRatio * 100) / 100,
  }));
};