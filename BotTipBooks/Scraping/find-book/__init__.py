import logging
import time
from urllib.request import urlopen

from bs4 import BeautifulSoup
import requests
import json
import azure.functions as func

# parametri di configurazione bing search
subscriptionKey = ""
customConfigId = ""
list_of_links = []

def main(req: func.HttpRequest) -> func.HttpResponse:
    name_of_book= req.params.get('name') 
    who_has_to_scrape = req.params.get('who') 
    if not name_of_book or not who_has_to_scrape:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            name_of_book = req_body.get('name')
            who_has_to_scrape = req_body.get('who')

    if name_of_book and who_has_to_scrape:
       list_of_results = wich_scraper(name_of_book,who_has_to_scrape)
       if len(list_of_results)<=5:
           return func.HttpResponse(f"""{list_of_results[0]} \n {list_of_results[1]} \n
            {list_of_results[2]} \n {list_of_results[3]} \n {list_of_results[4]}\n {list_of_results[5]}\n""")
       else:
           all_of_res =''
           for elem in list_of_results:
               all_of_res+=str(elem)
               all_of_res+='\n'
           return func.HttpResponse(all_of_res)
    else:
        return func.HttpResponse(
            "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.",
            status_code=200
        )


def call_bing (searchTerms,list_):
    url = 'https://api.bing.microsoft.com/v7.0/custom/search?q=' + searchTerms + '&' + 'customconfig=' + customConfigId + '&mkt=it-IT&count=1'
    r = requests.get(url, headers={'Ocp-Apim-Subscription-Key': subscriptionKey})
    json_object_result = json.loads(r.text)
    values= json_object_result['webPages']['value']
    list_.append(values[0]['url'])

def scrape_hoepli (url):   # in ordine restituisce titolo,autore,disponibilità e prezzo, genere
    page = urlopen(url)
    html_bytes = page.read()
    html = html_bytes.decode("utf-8")
    soup = BeautifulSoup(html, "html.parser")
    list_of_result = []
    list_of_result.append('Hoepli')
    tit = soup.find('h1')
    vero_titolo = tit.text
    li = vero_titolo.split('\t')
    li = li[0].split('\r')
    li = li[0].split('\n')
    nuova = li[0].rstrip()
    nuova = nuova.lstrip()
    if tit is not None:
        list_of_result.append(nuova)
    else:
        list_of_result.append(None)
    aut = soup.find('h2',attrs={'class':'prodotto'})
    if aut is not None:
        list_of_result.append(aut.text)
    else:
        list_of_result.append(None)

    is_disp = soup.find('p',attrs={'class':'disp_frase'})
    if is_disp is None:
        list_of_result.append('Non disponibile')
    else:
        list_of_result.append('Disponibile')

    prezzo = soup.findAll("div",attrs={"class":"prezzo"})
    for span in prezzo:
        if span.find('span').text is not None:
            prezzo_senza_euro = span.find('span').text
            prezzo_senza_euro = prezzo_senza_euro.replace('€','')
            list_of_result.append(prezzo_senza_euro)
        else:
            list_of_result.append(None)

    gener = soup.findAll("span",attrs={'class':'fs11'})
    genere =''
    for g in gener:
        if g.text is not None:
            genere+=g.text+', '
        else:
            genere = None
    list_of_result.append(genere)
    list_of_result.append(url)
    
    return list_of_result

def scrape_ibs(url):  
    page = urlopen(url)
    html_bytes = page.read()
    html = html_bytes.decode("utf-8")
    soup = BeautifulSoup(html, "html.parser")
    ibs_result =[]
    ibs_result.append('Ibs')
    priceString = soup.find("h2", class_="price__current")  # prezzo
    availability = soup.find("p", class_="availability__time availability available")
    title = soup.find("h1", class_="title__text")
    author = soup.find("h2", class_="subline__title author__title")
    if title is not None:
        title = title.text
        ibs_result.append(title)
    else:
        title='Titolo non disponibile'
        ibs_result.append(title)

    if author is not None:
        author=author.text
        author=author.lstrip()
        author=author.rstrip()
        ibs_result.append(author)
    else:
        ibs_result.append(None)

    if availability is not None:
        availability=availability.text
        ibs_result.append(availability)
    else:
        ibs_result.append(None)

    if priceString is not None:
        priceString=priceString.text
        priceString=" ".join(priceString.split())
        priceString=priceString.replace(",", ".")
        priceString=priceString[2:len(priceString)]
        price=float(priceString)
        ibs_result.append(price)
    else:
        price =None
        ibs_result.append(price)
    ibs_result.append(None)
    ibs_result.append(url)
    return ibs_result

def scrape_amazon(url):
    clear_url = url[url.rindex('/') + 1:] 
    scrape_am_result =[]
    scrape_am_result.append('Amazon')
    params = {
        'api_key': '',
        'type': 'product',
        'asin': ''+clear_url, 
        'amazon_domain': 'amazon.it'

    }
    result = requests.get('https://api.rainforestapi.com/request', params)
    jsonStringResult = json.dumps(result.json())
    jsonResult = json.loads(jsonStringResult)
    try:
        scrape_am_result.append(jsonResult['product']['title'])
    except KeyError:
        scrape_am_result.append(None)
    try:
        autori = jsonResult['product']['authors']
        list_of_auth =""
        for autore in autori:
            list_of_auth+=autore['name']+' & '
        scrape_am_result.append(list_of_auth)
    except KeyError:
        scrape_am_result.append(None)
    try:
        scrape_am_result.append(jsonResult['product']['buybox_winner']['availability']['raw'])
    except KeyError:
        scrape_am_result.append('Non disponibile')
    try:
        prezzo_amazon = jsonResult['product']['buybox_winner']['price']['raw']
        prezzo_amazon = prezzo_amazon.replace('€','')
        scrape_am_result.append(prezzo_amazon)
    except KeyError:
        scrape_am_result.append(None)
    try:
        categorie = jsonResult['product']['categories']
        for i in range(len(categorie)):
            if i == len(categorie) - 1:
                scrape_am_result.append(categorie[i]['name'])
    except KeyError:
        scrape_am_result.append(None)
    scrape_am_result.append(url)
    return scrape_am_result

def scrape_mondadori(url): #completo
    page = urlopen(url)
    html_bytes = page.read()
    html = html_bytes.decode("utf-8")
    soup = BeautifulSoup(html, "html.parser")
    res_scrape = []
    res_scrape.append('Mondadori')
    title = soup.find("h1", class_="title")
    if title is not None:
        title = title.text
        li = title.split('\t')
        li = li[0].split('\r')
        li = li[0].split('\n')
        nuova = li[0].rstrip()
        nuova = nuova.lstrip()
        res_scrape.append(nuova)
    else:
        res_scrape.append(None)
    author = soup.find("a", class_="link nti-author")
    if author is not None:
        author = author.text
        author = author.lstrip()
        author = author.rstrip()
        res_scrape.append(author)
    else:
        res_scrape.append(None)
    availability = soup.find("span", class_="big lightGreen")
    if availability is not None:
        availability = availability.text.rstrip()
        availability = availability.lstrip()
        res_scrape.append(availability)
    else:
        res_scrape.append(None)
    priceString = soup.find("span", class_="old-price") 
    if priceString is None:
        priceString = soup.find("span", class_="priceBox")
        

    promoString = soup.find("span", class_="promo")
    newPrice = None
    if priceString is not None:
        priceString = " ".join(priceString.text.split())
        priceString = priceString[:len(priceString) - 2]
        priceString = priceString.replace(",", ".")
        price = float(priceString)
        if promoString is not None:
            promoString = promoString.text[1:len(promoString.text) - 1]
            promo = float(promoString)
            newPrice = price - (promo/ 100 * price).__round__(2)
        else:
            newPrice = None
        if newPrice is None:
            res_scrape.append(price)
        else:
            res_scrape.append(newPrice)
    else:
        res_scrape.append(None)
    genre = soup.find("a", class_="link sgn")
    if genre is not None:
        genre = genre.text
    else:
        genre = None
    res_scrape.append(genre)
    res_scrape.append(url)
    return res_scrape

def scrape_not_available_feltrinelli(url):
    page = requests.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')
    result_ = []
    result_.append('Feltrinelli')
    resultTitle = soup.findAll('div',attrs={"class":"head-intro"})
    if resultTitle is None:
        result_.append(None)
        result_.append(None)
    else: 
        for y in resultTitle:
            if y.find('h1') is not None:
                result_.append(y.find('h1').text)
            if y.find('a') is not None:
                result_.append(y.find('a').text)
    result_.append('Non Disponibile')
    if soup.find('span',attrs={'class':'price'}) is None:
        prezz = None
    else:
        prezz = soup.find('span',attrs={'class':'price'})
        prezz = prezz.text.lstrip()
        prezz = prezz.rstrip()
        prezz = prezz.replace('€','')
    result_.append(prezz)
    moreInfo = soup.findAll('div',attrs={"class":"block-content separate-block"})
    if moreInfo is None:
        result_.append(None)
    else:
        for info in moreInfo:
            if info.find('a') is None:
                result_.append(None)
            else:
                result_.append(info.find('a').text)
    return result_


def scrape_feltrinelli(url):
    page = requests.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')
    result_felt = []
    result_felt.append('Feltrinelli')
    resultTitle = soup.findAll('div', attrs={"class": "head-intro"})
    if resultTitle is None:
        result_felt.append(None)
        result_felt.append(None)
    else:
        for y in resultTitle:
            result_felt.append(y.find('span').text) 
            result_felt.append(print(y.find('a').text)) 

    resultAvailability = soup.findAll('div', attrs={"class": "availability"})
    if resultAvailability is None:
        result_felt.append('Non disponibile')
    else:
        for span in resultAvailability:
            if span.find('span') is not None:
                result_felt.append(span.find('span').text) 

    resultsPrice = soup.findAll('div', attrs={"class": "price clearfix"})
    if resultsPrice is None:
        result_felt.append(None)
    else:
        for x in resultsPrice:
            if x.find('span') is not None:
                pr_senza = x.find('span').text
                pr_senza = pr_senza.replace('€','')
                result_felt.append(pr_senza)
            else: 
                result_felt.append(None)

    
    moreInfo = soup.findAll('div', attrs={"class": "block-content separate-block"})
    for info in moreInfo:
        if info.find('a') is None:
            result_felt.append(None)
        else:
            result_felt.append(info.find('a').text)
    
    if len(result_felt)<5:
        result_felt = scrape_not_available_feltrinelli(url)
    result_felt.append(url)
    return result_felt


def wich_scraper(name,who):
    web_sites = ['Hoepli', 'Ibs','Mondadori', 'Feltrinelli','Amazon']
   
    if who =='all':
        for i in range(len(web_sites)):
            searchTerms = name+' libro'+' '+ web_sites[i]
            call_bing(searchTerms, list_of_links)
        result_of_hoepli_scrape = scrape_hoepli(list_of_links[len(list_of_links)-5])
        result_of_ibs_scrape = scrape_ibs(list_of_links[len(list_of_links)-4])
        result_of_mond_scrape = scrape_mondadori(list_of_links[len(list_of_links)-3])
        result_of_felt_scrape = scrape_feltrinelli(list_of_links[len(list_of_links)-2])
        link_amazon = list_of_links[len(list_of_links)-1]
        concat_list =[link_amazon]+ result_of_hoepli_scrape+result_of_ibs_scrape+result_of_mond_scrape+result_of_felt_scrape
        
        logging.info(concat_list)
        return concat_list

    if who =='hoepli':
        searchTerms = name+' libro'+' '+web_sites[0]
        call_bing(searchTerms,list_of_links)
        return scrape_hoepli(list_of_links[len(list_of_links)-1])

    if who =='ibs':
        searchTerms = name +' libro'+' ' + web_sites[1]
        call_bing(searchTerms, list_of_links)
        logging.info('link: '+list_of_links[0])
        return scrape_ibs(list_of_links[len(list_of_links)-1])
    if who =='amazon':
        searchTerms = name +' libro'+ ' ' + web_sites[4]
        call_bing(searchTerms, list_of_links)
        return scrape_amazon(list_of_links[len(list_of_links)-1])
    if who=='mondadori':
        searchTerms = name +' libro'+' ' + web_sites[2]
        call_bing(searchTerms, list_of_links)
        return scrape_mondadori(list_of_links[len(list_of_links)-1])
    if who=='feltrinelli':
        searchTerms = name +' libro'+' ' + web_sites[3]
        call_bing(searchTerms, list_of_links)
        return scrape_feltrinelli(list_of_links[len(list_of_links)-1])





