# Writes the I18N dictionary into app/index.html between /*I18N-START*/ and /*I18N-END*/.
import json, re, sys, opencc
sys.path.insert(0, 'tools'); from i18n_strings import S
conv = opencc.OpenCC('s2twp')
langs = {'es': {}, 'zh-Hans': {}, 'zh-Hant': {}, 'vi': {}}
dot_variants = ['Breathing seen {#p}% of the time with a strong signal', 'Breathing seen {#p}% of the time',
                'Breathing seen only {#p}% of the time', 'Short session ({d})', 'Weak signal (phone may be far from the chest)']
for en, es, zh, vi in S:
    langs['es'][en] = es; langs['zh-Hans'][en] = zh; langs['zh-Hant'][en] = conv.convert(zh); langs['vi'][en] = vi
    if en in dot_variants:
        langs['es'][en + '.'] = es + '.'; langs['zh-Hans'][en + '.'] = zh + '。'; langs['zh-Hant'][en + '.'] = conv.convert(zh) + '。'; langs['vi'][en + '.'] = vi + '.'
p = 'app/index.html'; s = open(p).read()
block = '/*I18N-START*/ Object.assign(I18N, ' + json.dumps(langs, ensure_ascii=False) + '); /*I18N-END*/'
if '/*I18N-START*/' in s:
    s = re.sub(r'/\*I18N-START\*/.*?/\*I18N-END\*/', lambda m: block, s, flags=re.S)
else:
    s = s.replace('  // language switching\n', '  ' + block + '\n  // language switching\n', 1)
open(p, 'w').write(s)
print('keys per language:', {k: len(v) for k, v in langs.items()})
