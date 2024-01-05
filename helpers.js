const dollarCurrencyCodes = [
  "aud",
  "bsd",
  "bbd",
  "bzd",
  "bmd",
  "bnd",
  "cad",
  "kyd",
  "fjd",
  "gyd",
  "hkd",
  "jmd",
  "kid",
  "lrd",
  "nad",
  "nzd",
  "sbd",
  "sgd",
  "srd",
  "twd",
  "ttd",
  "tvd",
  "xcd",
  "zar",
];
const zeroDecimalCurrencyCodes = [
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
];

const threeDecimalCurrencyCodes = ["bhd", "jod", "kwd", "omr", "tnd"];

const getDollarPrefix = (currency) => {
  if (currency.endsWith("d")) {
    return currency.slice(0, -1).toUpperCase() + "$";
  }
  return currency.toUpperCase() + "$";
};

const formatCurrency = (countryCode, currencyCode, amount) => {
  let removeDecimals = false;
  let divisor = 100;
  if (zeroDecimalCurrencyCodes.includes(currencyCode)) {
    divisor = 1;
  } else if (threeDecimalCurrencyCodes.includes(currencyCode)) {
    divisor = 1000;
  } else if (amount % 100 === 0) {
    removeDecimals = true;
  }

  const currencyFormatter = Intl.NumberFormat(`en-${countryCode}`, {
    style: "currency",
    currency: currencyCode,
    ...(removeDecimals && { maximumFractionDigits: 0 }),
  });

  let humanReadableAmount = currencyFormatter.format(amount / divisor);

  if (dollarCurrencyCodes.includes(currencyCode)) {
    // Disambiguate $ for non-USD
    humanReadableAmount = humanReadableAmount.replace("$", getDollarPrefix(currencyCode));
  }

  return humanReadableAmount;
};

const getHumanTime = (renewalDate) => {
  return renewalDate.toLocaleDateString("en-US", { year: "numeric", day: "numeric", month: "long" });
};

const getDaysUntilRenewal = (renewalDate, now = null) => {
  if (!now) {
    // This should generally not be defined; just overridable for testing
    now = new Date();
  }
  const ONE_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((renewalDate.getTime() - now.getTime()) / ONE_DAY);
};

module.exports = { formatCurrency, getDollarPrefix, getHumanTime, getDaysUntilRenewal };
