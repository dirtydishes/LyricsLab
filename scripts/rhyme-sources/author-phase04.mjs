import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/rhyme-sources');
await mkdir(root, { recursive: true });
const cmuPronunciations = loadLegacyCmuPronunciations(
  await readFile(path.resolve('data/cmudict.txt'), 'utf8'),
);

const evidence = [
  ['editorial.dropped', 'Project editorial review of productive final-NG omission in common -ing forms. Direct transcriptions were checked against the repository legacy CMU snapshot and must be revalidated against the exact Phase 04A pin; regional tags indicate relevance, not claimed origin.'],
  ['editorial.apostrophe', 'Project editorial review of apostrophe-marked colloquial spellings and their unmarked counterparts.'],
  ['editorial.fused', 'Project editorial review of established fused conversational forms used in contemporary US hip-hop writing.'],
  ['editorial.stylized', 'Project editorial review of deliberate phonetic and stylized spellings used in contemporary writing.'],
  ['editorial.colloquial', 'Project editorial review of contemporary colloquial vocabulary and ordinary profanity.'],
  ['editorial.adlib', 'Project editorial review of non-lexical and lexical hip-hop ad-libs with direct ARPAbet transcription.'],
  ['editorial.inflection', 'Project editorial review of productive inflections of contemporary vocabulary.'],
  ['editorial.safety', 'Narrow project-maintained high-risk identity-slur policy review; retained only to analyze typed anchors and suppress unsolicited output.'],
  ['editorial.proper', 'Project editorial review of US place names and regional acronyms relevant to hip-hop writing; inclusion does not imply origin claims.'],
].map(([id, basis]) => ({ basis, id, kind: 'project-editorial', reviewedAt: '2026-07-12' }));

const entries = [];
const normalize = (surface) => surface
  .normalize('NFC')
  .toLowerCase()
  .trim()
  .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
const add = ({ surface, pronunciation, category, regions = ['national'], evidenceId, flags = ['rap'], id }) => {
  const normalized = normalize(surface);
  entries.push({
    category,
    evidenceIds: [evidenceId],
    flags,
    id: id ?? `rap.${normalized.replace(/[^a-z0-9]+/gu, '-')}`,
    normalized,
    pronunciation,
    regions,
    reviewState: 'reviewed',
    surface,
  });
};
const alias = (target) => {
  const verifiedPhones = cmuPronunciations.get(target);
  if (!verifiedPhones) throw new Error(`Legacy CMU validation cannot resolve alias: ${target}`);
  return { kind: 'alias', target, verifiedPhones };
};
const direct = (phones) => ({ kind: 'direct', phones: phones.split(' ') });

const ingWords = `acting adding asking backing banging battling beating bending betting blocking bouncing breaking breathing bringing building burning calling carrying catching changing chasing chilling choosing coming cooking counting creating crying cutting dancing dealing digging doing dreaming drinking driving dropping earning eating ending falling feeling fighting finding finishing fitting flipping flowing flying folding following getting giving going grinding growing guessing hanging hearing hitting holding hoping hustling jumping keeping kicking killing knowing landing laughing leading learning leaving letting lighting living looking losing loving making meaning meeting missing moving needing opening paying playing popping pouring praying pulling pushing putting racing rapping reaching reading riding rising rolling running saying seeing selling sending serving shining shooting showing singing sitting sleeping sliding smoking speaking spending spinning standing starting staying stepping stopping talking thinking throwing touching trapping traveling trying turning walking watching wearing winning wishing working writing yelling zoning arriving believing belonging blowing buying celebrating climbing closing connecting controlling cruising deciding delivering disappearing drawing escaping explaining facing fading feeding filling focusing freezing hiding ignoring imagining improving joining lying marching mixing passing picking planning pressing recording remembering repeating`.split(' ');

for (const [index, target] of ingWords.entries()) {
  const stem = target.slice(0, -1);
  const regions = index % 5 === 0 ? ['national', 'south']
    : index % 5 === 1 ? ['national', 'northeast']
      : index % 5 === 2 ? ['national', 'midwest']
        : index % 5 === 3 ? ['national', 'west-coast'] : ['national'];
  const apostropheMarked = index % 2 === 0;
  add({
    surface: apostropheMarked ? `${stem}'` : stem,
    pronunciation: { kind: 'direct', phones: droppedIngPhones(target) },
    category: apostropheMarked ? 'apostrophe-variant' : 'dropped-sound',
    regions,
    evidenceId: apostropheMarked ? 'editorial.apostrophe' : 'editorial.dropped',
  });
}

const shortenedForms = [
  ["'bout", direct('B AW1 T')], ["'cause", direct('K AH0 Z')], ["'em", direct('AH0 M')], ["'round", direct('R AW1 N D')], ["'til", direct('T IH1 L')],
  ['cuz', direct('K AH1 Z')], ['cos', direct('K AH1 Z')], ['bout', direct('B AW1 T')], ['cause', direct('K AH0 Z')], ['em', direct('AH0 M')],
  ['round', direct('R AW1 N D')], ['til', direct('T IH1 L')], ['nothin', { kind: 'direct', phones: droppedIngPhones('nothing') }], ["nothin'", { kind: 'direct', phones: droppedIngPhones('nothing') }],
  ['somethin', { kind: 'direct', phones: droppedIngPhones('something') }], ["somethin'", { kind: 'direct', phones: droppedIngPhones('something') }],
  ['everythin', { kind: 'direct', phones: droppedIngPhones('everything') }], ["everythin'", { kind: 'direct', phones: droppedIngPhones('everything') }],
  ['anythin', { kind: 'direct', phones: droppedIngPhones('anything') }], ["anythin'", { kind: 'direct', phones: droppedIngPhones('anything') }],
  ['tellin', { kind: 'direct', phones: droppedIngPhones('telling') }], ["tellin'", { kind: 'direct', phones: droppedIngPhones('telling') }],
  ['feelin', { kind: 'direct', phones: droppedIngPhones('feeling') }], ["feelin'", { kind: 'direct', phones: droppedIngPhones('feeling') }],
  ['chasin', { kind: 'direct', phones: droppedIngPhones('chasing') }], ["chasin'", { kind: 'direct', phones: droppedIngPhones('chasing') }],
  ['dreamin', { kind: 'direct', phones: droppedIngPhones('dreaming') }], ["dreamin'", { kind: 'direct', phones: droppedIngPhones('dreaming') }],
  ['schemin', { kind: 'direct', phones: droppedIngPhones('scheming') }], ["schemin'", { kind: 'direct', phones: droppedIngPhones('scheming') }],
];
for (const [surface, pronunciation] of shortenedForms) {
  if (entries.some((entry) => entry.normalized === normalize(surface))) continue;
  add({ surface, pronunciation, category: surface.includes("'") ? 'apostrophe-variant' : 'dropped-sound', evidenceId: surface.includes("'") ? 'editorial.apostrophe' : 'editorial.dropped' });
}

const fused = {
  gonna: 'G AH0 N AH0', wanna: 'W AA1 N AH0', gotta: 'G AA1 T AH0', lemme: 'L EH1 M IY0', gimme: 'G IH1 M IY0',
  dunno: 'D AH0 N OW1', kinda: 'K AY1 N D AH0', sorta: 'S AO1 R T AH0', lotta: 'L AA1 T AH0', outta: 'AW1 T AH0',
  coulda: 'K UH1 D AH0', woulda: 'W UH1 D AH0', shoulda: 'SH UH1 D AH0', mighta: 'M AY1 T AH0', musta: 'M AH1 S T AH0',
  hafta: 'HH AE1 F T AH0', oughta: 'AO1 T AH0', whatcha: 'W AH1 CH AH0', gotcha: 'G AA1 CH AH0', betcha: 'B EH1 CH AH0',
  dontcha: 'D OW1 N CH AH0', wontcha: 'W OW1 N CH AH0', didntcha: 'D IH1 D N CH AH0', cantcha: 'K AE1 N CH AH0', cmon: 'K AH0 M AA1 N',
  wassup: 'W AH0 S AH1 P', sup: 'S AH1 P', tryna: 'T R AY1 N AH0', finna: 'F IH1 N AH0', imma: 'AY1 M AH0',
  ion: 'AY1 OW1 N', yall: 'Y AO1 L', "y'all": 'Y AO1 L', "ain't": 'EY1 N T', gotchu: 'G AA1 CH UW0',
  watchu: 'W AH1 CH UW0', needta: 'N IY1 D T AH0', usedta: 'Y UW1 S T AH0', sposedta: 'S P OW1 Z D T AH0', boutta: 'B AW1 T AH0',
  fixinta: 'F IH1 K S IH0 N T AH0', lookinlike: 'L UH1 K IH0 N L AY1 K', actinlike: 'AE1 K T IH0 N L AY1 K', trynaget: 'T R AY1 N AH0 G EH1 T',
  wannabe: 'W AA1 N AH0 B IY0', gottabe: 'G AA1 T AH0 B IY0', immahead: 'AY1 M AH0 HH EH1 D', lemmeget: 'L EH1 M IY0 G EH1 T',
};
for (const [surface, phones] of Object.entries(fused)) {
  const regions = ['finna', 'boutta', 'fixinta'].includes(surface)
    ? ['national', 'south']
    : ['national'];
  add({ surface, pronunciation: direct(phones), category: 'fused-phrase', regions, evidenceId: 'editorial.fused' });
}

const stylizedAliases = [
  ['luv', 'love'], ['nite', 'night'], ['thru', 'through'], ['tho', 'though'], ['doe', 'though'], ['dat', 'that'], ['dis', 'this'],
  ['dem', 'them'], ['wit', 'with'], ['wuz', 'was'], ['iz', 'is'], ['ya', 'you'], ['ur', 'your'], ['fo', 'for'],
  ['nite', 'night'], ['rite', 'right'], ['lite', 'light'],
  ['werk', 'work'], ['werked', 'worked'], ['werkout', 'workout'], ['skool', 'school'], ['kool', 'cool'], ['kash', 'cash'],
  ['klassic', 'classic'], ['kwik', 'quick'], ['tru', 'true'],
];
for (const [surface, target] of stylizedAliases) {
  if (entries.some((entry) => entry.normalized === surface)) continue;
  add({ surface, pronunciation: alias(target), category: 'stylized-spelling', evidenceId: 'editorial.stylized' });
}

const stylizedDirect = {
  ya: 'Y AH0', fo: 'F OW1', mo: 'M OW1', sho: 'SH OW1', fa: 'F AH0', ta: 'T AH0',
  realer: 'R IY1 L ER0', realest: 'R IY1 L AH0 S T', flyest: 'F L AY1 AH0 S T', freshest: 'F R EH1 SH AH0 S T',
  lil: 'L IH1 L', lilest: 'L IH1 L AH0 S T', shorty: 'SH AO1 R T IY0', shawty: 'SH AO1 R T IY0',
};
for (const [surface, phones] of Object.entries(stylizedDirect)) {
  if (entries.some((entry) => entry.normalized === normalize(surface))) continue;
  add({ surface, pronunciation: direct(phones), category: 'stylized-spelling', evidenceId: 'editorial.stylized' });
}

const colloquial = {
  bruh: 'B R AH1', brodie: 'B R OW1 D IY0', homie: 'HH OW1 M IY0', fam: 'F AE1 M', crew: 'K R UW1', squad: 'S K W AA1 D',
  clique: 'K L IY1 K', posse: 'P AA1 S IY0', bestie: 'B EH1 S T IY0', twin: 'T W IH1 N', opp: 'AA1 P', ops: 'AA1 P S',
  cap: 'K AE1 P', nofilter: 'N OW1 F IH1 L T ER0', facts: 'F AE1 K T S', bet: 'B EH1 T', valid: 'V AE1 L IH0 D',
  lit: 'L IH1 T', litty: 'L IH1 T IY0', turnt: 'T ER1 N T', wavy: 'W EY1 V IY0', icy: 'AY1 S IY0', drippy: 'D R IH1 P IY0',
  trill: 'T R IH1 L', dope: 'D OW1 P', fuego: 'F W EH1 G OW0', sauce: 'S AO1 S', drip: 'D R IH1 P', wave: 'W EY1 V',
  vibe: 'V AY1 B', energy: 'EH1 N ER0 JH IY0', flex: 'F L EH1 K S', stunt: 'S T AH1 N T', hustle: 'HH AH1 S AH0 L', grind: 'G R AY1 N D',
  trap: 'T R AE1 P', bars: 'B AA1 R Z', flow: 'F L OW1', cypher: 'S AY1 F ER0', freestyle: 'F R IY1 S T AY2 L', mixtape: 'M IH1 K S T EY2 P',
  banger: 'B AE1 NG ER0', bop: 'B AA1 P', slap: 'S L AE1 P', anthem: 'AE1 N TH AH0 M', hook: 'HH UH1 K', beat: 'B IY1 T',
  bassline: 'B EY1 S L AY2 N', bankroll: 'B AE1 NG K R OW2 L', racks: 'R AE1 K S', bands: 'B AE1 N D Z', guap: 'G W AA1 P',
  bread: 'B R EH1 D', cheese: 'CH IY1 Z', dough: 'D OW1', bag: 'B AE1 G', paper: 'P EY1 P ER0', coin: 'K OY1 N',
  clout: 'K L AW1 T', hype: 'HH AY1 P', smoke: 'S M OW1 K', shade: 'SH EY1 D', ghost: 'G OW1 S T', troll: 'T R OW1 L',
  roast: 'R OW1 S T', clown: 'K L AW1 N', savage: 'S AE1 V IH0 JH', savagey: 'S AE1 V IH0 JH IY0', petty: 'P EH1 T IY0',
  bougie: 'B UW1 ZH IY0', lowkey: 'L OW1 K IY2', highkey: 'HH AY1 K IY2', woke: 'W OW1 K', wokeish: 'W OW1 K IH0 SH',
  goat: 'G OW1 T', legend: 'L EH1 JH AH0 N D', icon: 'AY1 K AA2 N', queen: 'K W IY1 N', king: 'K IH1 NG', boss: 'B AO1 S',
  shit: 'SH IH1 T', fuck: 'F AH1 K', bitch: 'B IH1 CH', damn: 'D AE1 M', ass: 'AE1 S', motherfucker: 'M AH1 DH ER0 F AH2 K ER0',
};
for (const [surface, phones] of Object.entries(colloquial)) add({ surface, pronunciation: direct(phones), category: 'colloquialism', evidenceId: 'editorial.colloquial' });

const regionallyScoped = [
  ['jawn', 'JH AO1 N', ['northeast']], ['deadass', 'D EH1 D AE2 S', ['northeast']], ['ock', 'AA1 K', ['northeast']],
  ['brickcity', 'B R IH1 K S IH2 T IY0', ['northeast']], ['wordup', 'W ER1 D AH1 P', ['northeast']], ['sonny', 'S AH1 N IY0', ['northeast']],
  ['hella', 'HH EH1 L AH0', ['west-coast']], ['hyphy', 'HH AY1 F IY0', ['west-coast']], ['lowrider', 'L OW1 R AY2 D ER0', ['west-coast']],
  ['slab', 'S L AE1 B', ['south']], ['crunk', 'K R AH1 NG K', ['south']], ['dirtysouth', 'D ER1 T IY0 S AW1 TH', ['south']],
  ['trapstar', 'T R AE1 P S T AA2 R', ['south']], ['screwedup', 'S K R UW1 D AH1 P', ['south']], ['jit', 'JH IH1 T', ['south']],
  ['juke', 'JH UW1 K', ['midwest']], ['buffies', 'B AH1 F IY0 Z', ['midwest']], ['drilltime', 'D R IH1 L T AY2 M', ['midwest']],
  ['zooted', 'Z UW1 T IH0 D', ['national']], ['pressed', 'P R EH1 S T', ['national']], ['glizzy', 'G L IH1 Z IY0', ['national']],
  ['blicky', 'B L IH1 K IY0', ['national']], ['motion', 'M OW1 SH AH0 N', ['national']], ['outside', 'AW1 T S AY1 D', ['national']],
  ['lockedin', 'L AA1 K T IH1 N', ['national']], ['upnext', 'AH1 P N EH1 K S T', ['national']], ['dayone', 'D EY1 W AH1 N', ['national']],
  ['toolie', 'T UW1 L IY0', ['national']], ['whip', 'W IH1 P', ['national']], ['foreign', 'F AO1 R AH0 N', ['national']],
];
for (const [surface, phones, regions] of regionallyScoped) {
  add({ surface, pronunciation: direct(phones), category: 'colloquialism', regions, evidenceId: 'editorial.colloquial' });
}

const adlibs = {
  ayy: 'EY1', ayyy: 'EY1', aye: 'AY1', yeah: 'Y AE1', yeh: 'Y EH1', yep: 'Y EH1 P', yup: 'Y AH1 P', nah: 'N AA1', naw: 'N AO1',
  uh: 'AH1', uhh: 'AH1', um: 'AH1 M', hmm: 'HH AH1 M', mmm: 'M AH1 M', woo: 'W UW1', woah: 'W OW1', whoa: 'W OW1', hey: 'HH EY1',
  ha: 'HH AA1', haha: 'HH AA1 HH AA0', hehe: 'HH IY1 HH IY0', okay: 'OW2 K EY1', okurrr: 'OW2 K ER1', skrrt: 'S K ER1 T',
  skrrrt: 'S K ER1 T', brrr: 'B ER1', burr: 'B ER1', pow: 'P AW1', bow: 'B AW1', bang: 'B AE1 NG', boom: 'B UW1 M',
  blam: 'B L AE1 M', sheesh: 'SH IY1 SH', geez: 'JH IY1 Z', oof: 'UW1 F', whew: 'W UW1', whee: 'W IY1', grr: 'G ER1',
  rah: 'R AA1', la: 'L AA1', lala: 'L AA1 L AA0', nanana: 'N AA1 N AA0 N AA0', ganggang: 'G AE1 NG G AE2 NG', letsgo: 'L EH1 T S G OW1',
};
for (const [surface, phones] of Object.entries(adlibs)) add({ surface, pronunciation: direct(phones), category: 'ad-lib', evidenceId: 'editorial.adlib' });

const inflections = {
  flexin: 'F L EH1 K S IH0 NG', flexed: 'F L EH1 K S T', flexer: 'F L EH1 K S ER0',
  cappin: 'K AE1 P IH0 NG', capped: 'K AE1 P T', capper: 'K AE1 P ER0',
  drippin: 'D R IH1 P IH0 NG', dripped: 'D R IH1 P T', dripper: 'D R IH1 P ER0',
  vibin: 'V AY1 B IH0 NG', vibed: 'V AY1 B D', viber: 'V AY1 B ER0',
  stuntin: 'S T AH1 N T IH0 NG', stunted: 'S T AH1 N T IH0 D', stunter: 'S T AH1 N T ER0',
  stackin: 'S T AE1 K IH0 NG', stacked: 'S T AE1 K T', stacker: 'S T AE1 K ER0',
  baggin: 'B AE1 G IH0 NG', bagged: 'B AE1 G D', bagger: 'B AE1 G ER0',
  ghostin: 'G OW1 S T IH0 NG', ghosted: 'G OW1 S T IH0 D', ghoster: 'G OW1 S T ER0',
  trollin: 'T R OW1 L IH0 NG', trolled: 'T R OW1 L D', troller: 'T R OW1 L ER0',
  roastin: 'R OW1 S T IH0 NG', roasted: 'R OW1 S T IH0 D', roaster: 'R OW1 S T ER0',
  clownin: 'K L AW1 N IH0 NG', clowned: 'K L AW1 N D', clowner: 'K L AW1 N ER0',
  snappin: 'S N AE1 P IH0 NG', snapped: 'S N AE1 P T', snapper: 'S N AE1 P ER0',
  slappin: 'S L AE1 P IH0 NG', slapped: 'S L AE1 P T', slapper: 'S L AE1 P ER0',
  bumpin: 'B AH1 M P IH0 NG', bumped: 'B AH1 M P T', bumper: 'B AH1 M P ER0',
  rockin: 'R AA1 K IH0 NG', rocked: 'R AA1 K T', rocker: 'R AA1 K ER0',
  ballin: 'B AO1 L IH0 NG', balled: 'B AO1 L D', baller: 'B AO1 L ER0',
  bossin: 'B AO1 S IH0 NG', bossed: 'B AO1 S T', bossest: 'B AO1 S AH0 S T',
  wavin: 'W EY1 V IH0 NG', waved: 'W EY1 V D', waver: 'W EY1 V ER0',
  bruhs: 'B R AH1 Z', homies: 'HH OW1 M IY0 Z', crews: 'K R UW1 Z', squads: 'S K W AA1 D Z',
  cliques: 'K L IY1 K S', posses: 'P AA1 S IY0 Z', besties: 'B EH1 S T IY0 Z', twins: 'T W IH1 N Z',
  cyphers: 'S AY1 F ER0 Z', freestyles: 'F R IY1 S T AY2 L Z', mixtapes: 'M IH1 K S T EY2 P S',
  bangers: 'B AE1 NG ER0 Z', bops: 'B AA1 P S', anthems: 'AE1 N TH AH0 M Z', hooks: 'HH UH1 K S',
  beats: 'B IY1 T S', basslines: 'B EY1 S L AY2 N Z', bankrolls: 'B AE1 NG K R OW2 L Z', bags: 'B AE1 G Z',
  papers: 'P EY1 P ER0 Z', coins: 'K OY1 N Z', legends: 'L EH1 JH AH0 N D Z', icons: 'AY1 K AA2 N Z',
  bosses: 'B AO1 S IH0 Z', hustlers: 'HH AH1 S AH0 L ER0 Z', grinders: 'G R AY1 N D ER0 Z', trappers: 'T R AE1 P ER0 Z',
};
for (const [surface, phones] of Object.entries(inflections)) {
  if (entries.some((entry) => entry.normalized === normalize(surface))) continue;
  add({ surface, pronunciation: direct(phones), category: 'common-inflection', evidenceId: 'editorial.inflection' });
}

const proper = {
  atlanta: 'AE0 T L AE1 N T AH0', brooklyn: 'B R UH1 K L AH0 N', bronx: 'B R AA1 NG K S', chicago: 'SH AH0 K AA1 G OW0',
  compton: 'K AA1 M P T AH0 N', detroit: 'D IH0 T R OY1 T', houston: 'HH Y UW1 S T AH0 N', memphis: 'M EH1 M F IH0 S',
  oakland: 'OW1 K L AH0 N D', queens: 'K W IY1 N Z', harlem: 'HH AA1 R L AH0 M', crenshaw: 'K R EH1 N SH AO2',
  inglewood: 'IH1 NG G AH0 L W UH2 D', newark: 'N UW1 ER0 K', baltimore: 'B AO1 L T AH0 M AO2 R', philly: 'F IH1 L IY0',
  miami: 'M AY0 AE1 M IY0', dallas: 'D AE1 L AH0 S', austin: 'AO1 S T AH0 N', nashville: 'N AE1 SH V IH0 L',
  atl: 'EY1 T IY1 EH1 L', nyc: 'EH1 N W AY1 S IY1', dmv: 'D IY1 EH1 M V IY1', 'l.a': 'EH1 L EY1', htown: 'EY1 CH T AW1 N',
};
for (const [surface, phones] of Object.entries(proper)) add({ surface, pronunciation: direct(phones), category: 'proper-name', regions: ['national'], evidenceId: 'editorial.proper', flags: ['proper-noun', 'rap'] });

const highRisk = {
  chink: 'CH IH1 NG K', gook: 'G UH1 K', kike: 'K AY1 K', spic: 'S P IH1 K', wetback: 'W EH1 T B AE2 K',
};
for (const [index, [surface, phones]] of Object.entries(highRisk).entries()) {
  add({
    surface,
    pronunciation: direct(phones),
    category: 'colloquialism',
    evidenceId: 'editorial.safety',
    flags: ['rap', 'safety-blocked'],
    id: `safety.${String(index + 1).padStart(3, '0')}`,
  });
}

entries.sort((left, right) => left.normalized < right.normalized ? -1 : left.normalized > right.normalized ? 1 : 0);
const seen = new Set();
for (const entry of entries) {
  if (seen.has(entry.normalized)) throw new Error(`Duplicate authored surface: ${entry.normalized}`);
  seen.add(entry.normalized);
}

const safety = {
  anchorBehavior: 'analyze',
  maintainedEntryIds: entries.filter((entry) => entry.flags.includes('safety-blocked')).map((entry) => entry.id).sort(),
  ordinaryProfanity: 'eligible',
  schema: 'lyricslab.rhyme-safety-policy',
  schemaVersion: 1,
  unsolicitedBehavior: 'suppress-safety-blocked',
};
const properPolicy = {
  anchorBehavior: 'analyze',
  maintainedEntryIds: entries.filter((entry) => entry.flags.includes('proper-noun')).map((entry) => entry.id).sort(),
  prefixBehavior: 'require-explicit-normalized-prefix',
  schema: 'lyricslab.rhyme-proper-noun-policy',
  schemaVersion: 1,
};

const sourceFiles = [
  ['evidence', 'evidence.json', evidence],
  ['lexicon', 'lexicon.json', entries],
  ['safety-policy', 'safety-policy.json', safety],
  ['proper-noun-policy', 'proper-noun-policy.json', properPolicy],
];
const sources = [];
for (const [role, file, value] of sourceFiles) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeFile(path.join(root, file), bytes);
  sources.push({ id: `project.${role}`, ownership: 'project-authored', path: file, role, sha256: createHash('sha256').update(bytes).digest('hex'), version: '2026.07.12' });
}

const manifest = {
  corpus: {
    categoryMinimums: {
      'ad-lib': 30,
      'apostrophe-variant': 50,
      colloquialism: 50,
      'common-inflection': 50,
      'dropped-sound': 50,
      'fused-phrase': 30,
      'proper-name': 20,
      'stylized-spelling': 25,
    },
    minimumEntries: 500,
    regionMinimums: {
      midwest: 20,
      national: 450,
      northeast: 20,
      south: 20,
      'west-coast': 20,
    },
  },
  ownership: {
    license: 'LyricsLab project-owned source data; all rights reserved pending release-policy decision',
    owner: 'LyricsLab',
    purpose: 'Reviewed source inputs for later Phase 04A production artifact assembly; not a complete production dictionary',
  },
  schema: 'lyricslab.rhyme-sources',
  schemaVersion: 1,
  sources,
};
await writeFile(path.join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`authored ${entries.length} reviewed entries\n`);

function loadLegacyCmuPronunciations(text) {
  const pronunciations = new Map();
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(';;;')) continue;
    const match = line.match(/^(\S+)\s+(.+)$/u);
    if (!match) continue;
    const word = match[1].replace(/\(\d+\)$/u, '').toLowerCase();
    if (!pronunciations.has(word)) pronunciations.set(word, match[2].trim().split(/\s+/u));
  }
  return pronunciations;
}

function droppedIngPhones(target) {
  const phones = cmuPronunciations.get(target);
  if (!phones || phones.at(-1) !== 'NG') {
    throw new Error(`Legacy CMU validation cannot resolve final-NG target: ${target}`);
  }
  return phones.slice(0, -1);
}
