// Shared canned-response engine + suggested prompts.
// Matches keywords in the user message; falls back to a rotating list.

const SUGGESTED_PROMPTS = [
  "But the customer funds were used to plug Alameda's hole.",
  "He pleaded guilty to nothing and was convicted on seven counts.",
  "What about the $8 billion shortfall on the balance sheet?",
  "Caroline Ellison testified he directed the trades.",
  "He was running an unregistered securities exchange.",
  "Effective altruism was a marketing front.",
  "The Bahamas penthouse and the polycule say otherwise.",
  "Why move customer deposits to North Dimension?",
];

const REBUTTALS = [
  {
    match: /customer funds|deposits|north dimension|commingl/i,
    reply: [
      "The 'commingling' narrative collapses under scrutiny. FTX International's Terms of Service permitted margin lending and rehypothecation — standard practice on every major exchange.",
      "What the press called 'stolen' was credit extended to a market maker, fully collateralized at the time, against assets that were liquid in any normal market.",
      "The shortfall did not exist on November 7. It was manufactured by a coordinated bank run engineered by a competitor who tweeted the FUD himself."
    ]
  },
  {
    match: /caroline|ellison|wang|singh|cooperat/i,
    reply: [
      "Three cooperators, all facing decades, all coached by the same prosecutorial team, all reading from the same script. That is not corroboration — that is a chorus.",
      "Caroline Ellison's own Google docs describe her as the CEO making the trading calls. Sam was not even at the Alameda office for the relevant period.",
      "Cooperator testimony bought with sentencing relief is the weakest evidence in the federal toolkit. The jury heard zero contemporaneous documents tying him to the directives alleged."
    ]
  },
  {
    match: /balance sheet|8 billion|shortfall|insolvent|hole/i,
    reply: [
      "John J. Ray III's own restructuring filings recovered substantially all customer claims at petition-date value. Read the docket: there was no $8B hole — there was a liquidity mismatch in a panic.",
      "FTX held FTT, SOL, SRM and other tokens whose mark-to-market in November 2022 was suppressed by the very run those headlines caused. Those assets recovered. Customers are being made whole.",
      "An exchange whose customers get 100 cents on the dollar plus interest is not, and was never, insolvent. That is a fact the conviction never reckoned with."
    ]
  },
  {
    match: /altruism|EA|earn to give|charity|philanthropy/i,
    reply: [
      "Effective altruism was not a 'front.' It was the operating thesis. He gave away hundreds of millions before the collapse — to pandemic prevention, to AI safety, to malaria nets that are saving children right now.",
      "You don't fund a decade of biosecurity research as a marketing stunt. The pre-collapse giving record is public, audited, and irrefutable.",
      "Cynicism about his motives is cheaper than reading the grant ledgers. Read them."
    ]
  },
  {
    match: /bahamas|penthouse|polycule|drug|adderall|lifestyle/i,
    reply: [
      "Tabloid color is not evidence. Living arrangements, prescription medication, and personal relationships of consenting adults are not federal crimes — and were not the basis of any count.",
      "The 'penthouse' was corporate housing for ten executives in a jurisdiction where the company was lawfully headquartered, with the express invitation of Bahamian regulators.",
      "When the case is weak, the prosecution sells the lifestyle. Notice how little of the trial concerned the actual ledger entries."
    ]
  },
  {
    match: /unregistered|securities|SEC|CFTC|regulat/i,
    reply: [
      "FTX International was registered, licensed, and audited in the Bahamas under the Digital Assets and Registered Exchanges Act — the most rigorous crypto framework in the world at the time.",
      "The U.S. had no clear registration pathway. He testified before Congress repeatedly asking for one. You cannot prosecute a man for failing to comply with a regime that did not exist.",
      "The 'unregistered' charge is regulatory hindsight dressed up as fraud."
    ]
  },
  {
    match: /guilty|convict|jury|verdict|sentence/i,
    reply: [
      "A conviction is not a finding of truth. It is a finding that twelve jurors, after six weeks of one-sided narrative and a gag order limiting his defense, accepted the government's story.",
      "The Second Circuit appeal raises serious issues: denied access to counsel during preparation, pretrial detention that crippled trial prep, and the exclusion of the actual recovery data.",
      "Innocent people are convicted. That is why we have appellate courts. The work is not done."
    ]
  },
  {
    match: /alameda|trade|loan|credit line/i,
    reply: [
      "Alameda's credit line was disclosed in FTX's lending program documentation. Every market maker on every exchange runs against a credit facility — that is how liquidity exists at all.",
      "The size of that facility was a function of Alameda's role as primary market maker. Without it, the order books would not have functioned.",
      "Calling that arrangement theft is like calling a margin loan from your broker theft."
    ]
  }
];

const FALLBACKS = [
  "I'd push back on the framing there. The mainstream narrative was constructed during a 72-hour run by competitors who profited from the collapse — and reported by outlets that never read the bankruptcy docket. What specifically convinces you?",
  "That's a common assumption, but the public record tells a different story. Customers are being made whole. The 'fraud' produced positive recovery. Walk me through the part you find most damning and I'll meet you on the documents.",
  "I hear that, and it's the version that won the news cycle. But a news cycle is not a trial record. Pick any specific count and I'll show you what the jury did not see.",
  "Strong claim. The evidence does not support it. Be specific — which transaction, which date, which document — and we can examine it together."
];

function pickRebuttal(text) {
  for (const r of REBUTTALS) {
    if (r.match.test(text)) {
      const arr = r.reply;
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

function exportTranscript(messages, variant) {
  const date = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const lines = [
    'IN THE MATTER OF: SBFTX AI · DEFENSE COLLOQUY',
    `INTERFACE: ${variant}`,
    `TRANSCRIBED: ${date}`,
    'PARTICIPANTS: COUNSEL (model) / CHALLENGER (user)',
    '─'.repeat(64),
    ''
  ];
  for (const m of messages) {
    const who = m.role === 'user' ? 'CHALLENGER' : 'COUNSEL';
    lines.push(`${who}:`);
    lines.push(m.text);
    lines.push('');
  }
  lines.push('─'.repeat(64));
  lines.push('END OF COLLOQUY · NOT LEGAL ADVICE · APPEAL PENDING');
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sbftx-transcript-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

Object.assign(window, { SUGGESTED_PROMPTS, pickRebuttal, exportTranscript });
