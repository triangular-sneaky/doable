[CmdletBinding()]
param (
  [switch]$Stop,
  [switch]$Init
)

docker-compose -f .\docker-compose-debug.yml down;

if ($Init) {
  Write-Warning "Ensure packages list from rebuild.wekan.bat"

  md packages
  cd packages
  git clone --depth 1 -b master https://github.com/wekan/flow-router.git kadira-flow-router
  git clone --depth 1 -b master https://github.com/meteor-useraccounts/core.git meteor-useraccounts-core
  git clone --depth 1 -b master https://github.com/wekan/meteor-accounts-cas.git
  git clone --depth 1 -b master https://github.com/wekan/wekan-ldap.git
  git clone --depth 1 -b master https://github.com/wekan/wekan-scrollbar.git
  cd ..
}

if (-not $Stop) {
  docker-compose -f .\docker-compose-debug.yml run --service-ports --rm wekan
}
