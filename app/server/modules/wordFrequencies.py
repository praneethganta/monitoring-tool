import re
import sys
import json
from collections import Counter

def remove_stopword(corpus,stopwords):
    f = open("./app/server/modules/mallet-stopwords-en.txt")
    data = f.read()
    stop_words = data.split("\n")[:-1]
    stop_words.extend(stopwords)
    for key in stop_words:
        corpus = re.sub(r'\b' + str.lower(str(key)) + r'\b','', corpus)

    return corpus

def remove_junk(corpus):
    #pattern = re.compile("[^\w'0-9]")
    pattern = re.compile("[^A-Za-z]")

    corpus = pattern.sub(' ', corpus)
    corpus = re.sub('   +', ' ', corpus)
    return corpus

def get_word_frequencies(corpus):
    words = corpus.split(" ")
    frequencies = Counter(words)
    del(frequencies[""])
    del(frequencies[r" +"])
    return dict(frequencies)

    return

stopwords =  ["question","clicked"]
corpus = sys.argv[1]
corpus = str.lower(corpus)
corpus = remove_junk(corpus)
corpus = remove_stopword(corpus,stopwords)
frequencies = get_word_frequencies(corpus)
print json.dumps(frequencies)
