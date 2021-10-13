## bol.com shops scrapper

#### Installation:
```
# npm install
```

#### Usage:
```
# node --no-warnings ./src/index.js start-shop-id end-shop-id threads-cnt
```
eg.
```
# node --no-warnings ./src/index.js 1494479 1495000 3
```

Currently script outputs data as csv. So easy usage is: 
```json
node --no-warnings ./src/index.js 1494479 1495000 3 >> result_1494479_1495000.csv
```