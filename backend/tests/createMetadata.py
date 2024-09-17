import json
import os

recourcesPath = os.path.join(os.path.dirname(__file__), '../resources')

with open(os.path.join(recourcesPath, 'regions.json'), 'r') as file:
    regionsData = json.load(file)

territoryDict = {
    'NSW' : 'New South Wales',
    'VIC' : 'Victoria',
    'QLD' : 'Queensland',
    'WA' : 'Western Australia',
    'SA' : 'South Australia',
    'TAS' : 'Tasmania',
    'ACT' : 'Australian Capital Territory',
    'NT' : 'Northern Territory',
    'JBT' : 'Jervis Bay Territory',
    'NI' : 'Norfolk Island',
    'CX' : 'Christmas Island',
    'CC' : 'Cocos (Keeling) Islands'
}

regionsDict = {}
for region in regionsData['regions']:
    regionId = region['id']
    territory = region['name'].split('/')[2]
    territoryName = territoryDict[territory]
    description = f"{region['display_name']} - Located in {territoryName} ({territory})"
    regionsDict[regionId] = description
with open(os.path.join(recourcesPath, 'regionsMetadata.json'), 'w') as file:
    json.dump(regionsDict, file)

with open(os.path.join(recourcesPath, 'datasets.json'), 'r') as file:
    datasetsData = json.load(file)

datasetsDict = {}

for dataset in datasetsData['datasets']:
    datasetId = dataset['id']
    sourceName = dataset['source']['name']
    description = dataset['description'] if 'description' in dataset else ''
    level = dataset['level']
    seriesName = dataset['series_name']
    displayName = dataset['display_name']
    name = dataset['name']
    metadata = f"{displayName} - {description} Level: {level}. Source: {sourceName} ({name})."
    datasetsDict[datasetId] = metadata
with open(os.path.join(recourcesPath, 'datasetsMetadata.json'), 'w') as file:
    json.dump(datasetsDict, file)