import sqlite3
import json
import os

import sys

db_name = 'davi-database.db'
db_name_translations = 'davi-database-with-translations.db'

directory = sys.argv[1]
if directory == '':
    directory = './'


def delete_db(with_translations=False):
    if (not with_translations and os.path.exists(f'{directory}/{db_name}')):
        os.remove(f'{directory}/{db_name}')
    elif(os.path.exists(f'{directory}/{db_name_translations}')):
        os.remove(f'{directory}/{db_name_translations}')


def connect_db(with_translations=False):
    try:
        conn = None
        if (not with_translations):
            conn = sqlite3.connect(f'{directory}/{db_name}')
        else:
            conn = sqlite3.connect(f'{directory}/{db_name_translations}')

        print("Database created!")
        return conn
    except Exception as e:
        print("Something bad happened: ", e)
        if conn:
            conn.close()


def create_table_talks(cursor):
    create_query = '''CREATE TABLE IF NOT EXISTS talks(
        id INTEGER PRIMARY KEY,
        audioInternalLanguageCode TEXT NOT NULL,
        canonicalUrl TEXT NOT NULL,
        description TEXT NOT NULL,
        duration INTEGER NOT NULL,
        language TEXT NOT NULL,
        presenterDisplayName TEXT NOT NULL,
        image16x9 TEXT NOT NULL,
        image4x3 TEXT NOT NULL,
        image2x1 TEXT NOT NULL,
        publishedAt DATE NOT NULL,
        hasTranslations BOOLEAN NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        viewedCount INTEGER NOT NULL,
        topics TEXT NOT NULL,
        urlLowQuality TEXT NOT NULL,
        urlMidQuality TEXT NOT NULL,
        urlHighQuality TEXT NOT NULL
    );
    '''
    cursor.execute(create_query)
    print("Table talks created")


def create_table_speakers(cursor):
    create_query = '''CREATE TABLE IF NOT EXISTS speakers(
        id INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        nameComplete TEXT NOT NULL,
        photoUrl TEXT NOT NULL,
        slug TEXT NOT NULL
    );
    '''
    cursor.execute(create_query)
    print("Table speakers created")


def create_table_talk_speakers(cursor):
    create_query = '''CREATE TABLE IF NOT EXISTS talk_speakers(
        idTalk INTEGER,
        idSpeaker INTEGER,
        FOREIGN KEY (idTalk) REFERENCES talks(id)
        FOREIGN KEY (idSpeaker) REFERENCES speaker(id)
    );
    '''
    cursor.execute(create_query)
    print("Table talk_speakers created")


def create_table_translations(cursor):
    create_query = '''CREATE TABLE IF NOT EXISTS translations(
        idTalk INTEGER,
        time INTEGER NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (idTalk) REFERENCES talks(id)
        PRIMARY KEY (idTalk, time)
    );
    '''
    cursor.execute(create_query)
    print("Table translations created")


def create_table_topics(cursor):
    create_query = '''CREATE TABLE IF NOT EXISTS topics(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    );
    '''
    cursor.execute(create_query)
    print("Table topics created")


def insert_into_table_talks(cursor, talk_unfixed):
    talk = fix_talk(talk_unfixed)
    create_query = '''INSERT INTO talks(\
        id, audioInternalLanguageCode, canonicalUrl, description, duration, \
        language, presenterDisplayName, title, type, viewedCount, topics,\
        urlLowQuality, urlMidQuality, urlHighQuality, publishedAt, hasTranslations, \
        image16x9, image4x3, image2x1)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    '''
    data = [talk['id'], talk['audioInternalLanguageCode'],
            talk['canonicalUrl'], talk['description'], talk['duration'],
            talk['language'], talk['presenterDisplayName'], talk['title'],
            talk['type'], talk['viewedCount'], talk['topics'], talk['urlLowQuality'],
            talk['urlMidQuality'], talk['urlHighQuality'], talk['publishedAt'], talk['hasTranslations'],
            talk['image16x9'], talk['image4x3'], talk['image2x1']]
    # print(create_query, data)
    cursor.execute(create_query, data)
    print(f"{talk['id']} talk inserted")


def insert_into_table_speakers(cursor, speaker_unfixed):
    speaker = fix_speaker(speaker_unfixed)
    create_query = '''INSERT OR REPLACE INTO speakers(
        id, description, nameComplete, photoUrl, slug)
        VALUES(?,?,?,?,?)
    '''
    data = [speaker['id'], speaker['description'], speaker['name_complete'], speaker['photoUrl'], speaker['slug']]
    # print(create_query, data)
    cursor.execute(create_query, data)
    print(f"{speaker['id']} speaker inserted")


def insert_into_table_talk_speakers(cursor, talk_id, speaker_id):
    create_query = '''INSERT INTO talk_speakers(
        idTalk, idSpeaker)
        VALUES(?,?)
    '''
    data = [talk_id, speaker_id]
    # print(create_query, data)
    cursor.execute(create_query, data)
    print(f"talk {talk_id} and speaker {speaker_id} inserted")


def insert_into_table_translations(cursor, talk_id, translation_paragraph):
    create_query = '''INSERT OR REPLACE INTO translations(
        idTalk, time, text)
        VALUES(?,?,?)
    '''

    data = [talk_id, translation_paragraph['text'], translation_paragraph['time']]
    # print(create_query, data)
    cursor.execute(create_query, data)
    # print(f"translation in {translation_paragraph['time']} for {talk_id} inserted")


def insert_into_table_topics(cursor, topic):
    create_query = '''INSERT INTO topics(
        name)
        VALUES(?)
    '''
    data = [topic]
    # print(create_query, data)
    cursor.execute(create_query, data)
    print(f"topic {topic} inserted")


def topics_to_string_list(topics):
    topics_list = []
    for topic in topics:
        topics_list.append(topic['name'])
    return ';'.join(topics_list)


def fix_talk(talk):
    fixed_talk = talk.copy()
    fixed_talk['id'] = int(fixed_talk['id'])
    fixed_talk['topics'] = topics_to_string_list(fixed_talk['topics']['nodes'])
    fixed_talk['type'] = fixed_talk['type']['name']

    fixed_talk['image16x9'] = ''
    fixed_talk['image4x3'] = ''
    fixed_talk['image2x1'] = ''
    if (len(talk['primaryImageSet']) > 0):
        for image in talk['primaryImageSet']:
            if (image['aspectRatioName'] == '16x9' and image['url'] is not None):
                fixed_talk['image16x9'] = image['url']
            if (image['aspectRatioName'] == '4x3' and image['url'] is not None):
                fixed_talk['image4x3'] = image['url']
            if (image['aspectRatioName'] == '2x1' and image['url'] is not None):
                fixed_talk['image2x1'] = image['url']

    fixed_talk['urlLowQuality'] = ''
    fixed_talk['urlMidQuality'] = ''
    fixed_talk['urlHighQuality'] = ''
    if (len(talk['videoDownloads']['nodes']) > 0):
        fixed_talk['urlLowQuality'] = talk['videoDownloads']['nodes'][0]['url']

    if (len(talk['videoDownloads']['nodes']) > 1):
        fixed_talk['urlMidQuality'] = talk['videoDownloads']['nodes'][1]['url']

    if (len(talk['videoDownloads']['nodes']) > 2):
        fixed_talk['urlHighQuality'] = talk['videoDownloads']['nodes'][2]['url']

    if fixed_talk['urlLowQuality'] and 'low' in talk['nativeDownloads']:
        fixed_talk['urlLowQuality'] = talk['nativeDownloads']['low']

    if fixed_talk['urlMidQuality'] and 'low' in talk['nativeDownloads']:
        fixed_talk['urlMidQuality'] = talk['nativeDownloads']['medium']

    if fixed_talk['urlHighQuality'] and 'low' in talk['nativeDownloads']:
        fixed_talk['urlHighQuality'] = talk['nativeDownloads']['high']

    return fixed_talk


def fix_speaker(speaker):
    fixed_speaker = speaker.copy()
    fixed_speaker['id'] = int(fixed_speaker['id'])
    firstname = fixed_speaker['firstname']
    lastname = fixed_speaker['lastname']
    fixed_speaker['name_complete'] = f"{firstname} {lastname}"

    return fixed_speaker


def fix_translations(translations):
    new_translations = []
    for paragraph in translations:
        for cue in paragraph['cues']:
            new_translation = {
                'time': cue['time'],
                'text': cue['text'],
            }
            new_translations.append(new_translation)
    return new_translations


def read_file_to_json():
    data = None
    with open(f'{directory}/ted_data.json', 'r') as file:
        data = json.load(file)
    print("File loaded")
    return data


def read_file_translations_to_json():
    data = None
    with open('ted_data_with_translation.json', 'r') as file:
        data = json.load(file)
    print("File translations loaded")
    return data


def insert_data(cursor, json_data):
    counter = 0
    for talk in json_data:
        speakers = talk['speakers']['nodes']
        for speaker in speakers:
            insert_into_table_speakers(cursor, speaker)
        insert_into_table_talks(cursor, talk)
        talk_fixed = fix_talk(talk)
        topics = talk_fixed['topics'].split(";")
        for topic in topics:
            try:
                insert_into_table_topics(cursor, topic)
            except sqlite3.IntegrityError:
                pass
        for speaker in speakers:
            insert_into_table_talk_speakers(cursor, talk['id'], speaker['id'])
        counter = counter + 1

    print(f"{counter} data inserted")


def insert_data_translations(cursor, json_data_translations):
    counter = 0
    for talk in json_data_translations:
        talk_id = talk['id']
        try:
            translations = fix_translations(talk['translation']['paragraphs'])
            for translation in translations:
                insert_into_table_translations(cursor, talk_id, translation)
            counter = counter + 1
        except KeyError:
            print(f"{talk_id} doens't have translation")

    print(f"{counter} translations inserted")


if __name__ == "__main__":
    with_translations = False

    delete_db(with_translations)
    conn = connect_db(with_translations)
    cursor = conn.cursor()
    create_table_talks(cursor)
    conn.commit()
    create_table_speakers(cursor)
    conn.commit()
    create_table_talk_speakers(cursor)
    conn.commit()
    create_table_topics(cursor)
    conn.commit()
    create_table_translations(cursor)
    conn.commit()
    json_data = read_file_to_json()

    insert_data(cursor, json_data)
    conn.commit()

    if (with_translations):
        json_data_translations = read_file_translations_to_json()
        insert_data_translations(cursor, json_data_translations)
        conn.commit()

    conn.close()
