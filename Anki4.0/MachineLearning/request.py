import requests
import json

# URL for the web service
scoring_uri = 'http://8467e0b1-201e-4679-ab53-1310c5b3e650.westeurope.azurecontainer.io/score'
# If the service is authenticated, set the key or token
key = 'S0BgLMWcFHlAaRGi4C6ClwvethaInlnb'

# Two sets of data to score, so we get two results back
data = {'text':"The organization that provides cloud-based IT resources is the cloud provider. When assuming the role of cloud provider, an organization is responsible for making cloud services available to cloud consumers, as per agreed upon SLA guarantees. The cloud provider is further tasked with any required management and administrative duties to ensure the on-going operation of the overall cloud infrastructure. Cloud providers normally own the IT resources that are made available for lease by cloud consumers; however, some cloud providers also “resell” IT resources leased from other cloud providers"}
# Convert to JSON string
input_data = json.dumps(data)

# Set the content type
headers = {'Content-Type': 'application/json'}
# If authentication is enabled, set the authorization header
headers['Authorization'] = f'Bearer {key}'

# Make the request and display the response
resp = requests.post(scoring_uri, input_data, headers=headers)
print(resp.text)
print(resp.status_code)
print(resp.elapsed)
print(resp.json())
