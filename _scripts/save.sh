git pull;
git add -A;
if [ -z $1 ]
then
  git commit -am "Update some stuff";
else
  git commit -am "$1";
fi
git push;
