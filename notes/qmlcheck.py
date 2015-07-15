with open('jsqts.txt') as f:
    lines1 = f.read().splitlines()

with open('qmltypes1.txt') as f:
    lines2 = f.read().splitlines()

checker = dict()

for line in lines2:
    key, val = line.split(maxsplit=1)
    checker[key] = ['N', val]

for line in lines1:
    lno, key = line.split()
    if key in checker:
        checker[key][0] = 'Y'
    else:
        checker[key] = ['U', 'no description']

cy, cn, cu = 0, 0, 0

for key in sorted(checker):
    val = checker[key]
    if val[0] == 'Y':
        cy += 1
        print('%-30s%1s   %s' % (key,  val[0], val[1]))

print('\n\n')
for key in sorted(checker):
    val = checker[key]
    if val[0] == 'N':
        cn += 1
        print('%-30s%1s   %s' % (key,  val[0], val[1]))

print('\n\n')
for key in sorted(checker):
    val = checker[key]
    if val[0] == 'U':
        cu += 1
        print('%-30s%1s   %s' % (key, val[0], val[1]))

print('\n\n')
print('Implemented        ', cy)
print('Not Implemented    ', cn)
print('Unknown            ', cu)
