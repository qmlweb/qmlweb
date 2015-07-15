with open('overview.txt') as f:
    lines1 = f.read().splitlines()

all = dict()

for line in lines1:
    line = line.strip()
    if line.startswith('###'):
        key = line[3:]
        val = dict()
        all[key] = val
        even = True
        continue
    if even:
        key = line
        even = False
    else:
        val[key] = line
        even = True

for key in sorted(all):
    print('\n\n%s\n%s\n' % (key, len(key)*'-'))
    vals = all[key]
    for item in sorted(vals):
        value = vals[item]
        print('%-30s    %s' % (item, value))

# cy, cn, cu = 0, 0, 0
#
# for key in sorted(checker):
#     val = checker[key]
#     if val[0] == 'Y':
#         cy += 1
#         print('%-30s%1s   %s' % (key,  val[0], val[1]))
#
# print('\n\n')
# for key in sorted(checker):
#     val = checker[key]
#     if val[0] == 'N':
#         cn += 1
#         print('%-30s%1s   %s' % (key,  val[0], val[1]))
#
# print('\n\n')
# for key in sorted(checker):
#     val = checker[key]
#     if val[0] == 'U':
#         cu += 1
#         print('%-30s%1s   %s' % (key, val[0], val[1]))
#
# print('\n\n')
# print('Implemented        ', cy)
# print('Not Implemented    ', cn)
# print('Unknown            ', cu)
