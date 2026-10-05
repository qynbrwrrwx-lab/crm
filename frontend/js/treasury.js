// État partagé de la trésorerie. Voir treasury/README.md.
let treasurySettings = { openingBalance: 0, openingBalanceDate: null, minimumBalance: 0 };
let treasuryEntries = [];
let editingTreasuryEntryId = null;
let treasuryChart;
