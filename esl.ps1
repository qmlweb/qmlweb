# Windows Powershell Script

ls -r src/*.js |
% { 'Now processing: ' + $_.name ; eslint $_ } |
tee-object esl.txt
