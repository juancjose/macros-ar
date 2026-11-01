import csv,json,re
D='/workspace/sr/FoodData_Central_sr_legacy_food_csv_2018-04/'
foods={r['fdc_id']:r['description'] for r in csv.DictReader(open(D+'food.csv'))}
N={'1008':'kcal','1003':'p','1005':'c','1004':'f','1079':'fib'}
nut={}
for r in csv.DictReader(open(D+'food_nutrient.csv')):
    if r['nutrient_id'] in N: nut.setdefault(r['fdc_id'],{})[N[r['nutrient_id']]]=float(r['amount'])
units={r['id']:r['name'] for r in csv.DictReader(open(D+'measure_unit.csv'))}
por={}
for r in csv.DictReader(open(D+'food_portion.csv')):
    por.setdefault(r['fdc_id'],[]).append((r['amount'],r['modifier'] or units.get(r['measure_unit_id'],''),float(r['gram_weight'])))
L=[l.split('|') for l in open('foods.txt').read().strip().split('\n') if l.strip() and not l.startswith('#')]
out=[];miss=[]
for i,(es,syn,cat,st,q) in enumerate(L):
    kws=[k.strip().lower() for k in q.split('&')]
    c=[(len(d),fid,d) for fid,d in foods.items() if all(k in d.lower() for k in kws) and fid in nut and 'kcal' in nut[fid]]
    if not c: miss.append(es+' :: '+q); continue
    _,fid,d=min(c)
    n=nut[fid]
    out.append(dict(id=i,n=es,s=syn,cat=cat,st=st,kcal=n['kcal'],p=n.get('p',0),c=n.get('c',0),f=n.get('f',0),fib=n.get('fib',0),src='USDA FoodData Central SR Legacy #'+fid,usda=d,por=[[f"{a} {m}".strip(),g] for a,m,g in por.get(fid,[])][:12]))
json.dump(out,open('foods.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out),'ok; missing:',*miss,sep='\n')
