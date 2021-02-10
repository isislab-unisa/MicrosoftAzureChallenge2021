resGroupName="RESOURCE GROUP NAME"  #Update me
adminDB="DB USERNAME"               #Update me
passDB="DB PASSWORD"                #Update me
subID="SUBSCRIPTION_ID"             #Update me
storageName="mystorageaccount$RANDOM"
planName="functionplan"
functionAppName="createvirtualmachine$RANDOM"
eventGridName="eventGrid$RANDOM"
webAppName="companyassistant$RANDOM"
webAppBotName="companyassistantBot$RANDOM"
botName="companyassistant-bot$RANDOM"
luisName="companyassistant-LUIS$RANDOM"
serverDBName="companyassistantserver"
region=westeurope


echo "CREATING RESOURCE GROUP..."

az group create -l $region -n $resGroupName



echo "CREATING VIRTUAL NETWORK..."

az network vnet create -n Default-vnet -g $resGroupName --subnet-name default



echo "CREATING NETWORK SECURITY GROUP.."

az network nsg create -g $resGroupName -n Default-nsg

az network nsg rule create --resource-group $resGroupName --nsg-name Default-nsg --name ssh --protocol tcp --priority 300 --destination-port-range 22

az network nsg rule create --resource-group $resGroupName --nsg-name Default-nsg --name rdp --protocol tcp --priority 301 --destination-port-range 3389

az network nsg rule create --resource-group $resGroupName --nsg-name Default-nsg --name vnc --protocol tcp --priority 302 --destination-port-range 5901



echo "CREATING APP SERVICE PLAN.."

az appservice plan create -g $resGroupName -n $planName --location $region --sku B1

az storage account create \
  --name $storageName \
  --location $region \
  --resource-group $resGroupName \
  --sku Standard_LRS



echo "CREATING FUNCTION APP.."

az functionapp create -p $planName --name $functionAppName --os-type Windows --resource-group $resGroupName --runtime node --functions-version 2 --disable-app-insights true --storage-account $storageName

az functionapp config set --always-on false --name $functionAppName --resource-group $resGroupName

az appservice plan update --name $planName --resource-group $resGroupName --sku F1

az functionapp deployment source config-zip -g $resGroupName -n $functionAppName --src ./Azure/FunctionApp.zip



echo "CREATING EVENT GRID.."

az eventgrid event-subscription create --name $eventGridName \
  --source-resource-id "/subscriptions/$subID/resourceGroups/$resGroupName" \
  --endpoint-type azurefunction \
  --endpoint /subscriptions/$subID/resourceGroups/$resGroupName/providers/Microsoft.Web/sites/$functionAppName/functions/EventGridTrigger \
  --advanced-filter subject StringContains CompanyAssistant.vms/providers/Microsoft.Compute/virtualMachines/ \
  --included-event-types Microsoft.Resources.ResourceWriteSuccess Microsoft.Resources.ResourceDeleteSuccess



echo "CREATING WEB APP.."

az webapp create -g $resGroupName -p $planName -n $webAppName
az webapp create -g $resGroupName -p $planName -n $webAppBotName


echo "CREATING LUIS.."

az cognitiveservices account create \
  --name $luisName \
  --resource-group $resGroupName \
  --kind LUIS \
  --sku F0 \
  --location westeurope



echo "CREATING DB.."

az sql server create -l $region -g $resGroupName -n $serverDBName --admin-user $adminDB --admin-password $passDB

az sql server firewall-rule create --resource-group $resGroupName --server $serverDBName -n AllowYourIp --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255 #Iserisci i tuoi ip

az sql db create -g $resGroupName -s $serverDBName -n Assistant --tier Basic

echo ""
echo "----FINISH----"
echo ""

echo "--          --"
echo "||          ||"
echo "      ||      "
echo "      --      "
echo "|            |"
echo "|____________|"
echo "   --------   "

echo ""
echo ""
echo ""
