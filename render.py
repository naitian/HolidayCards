import hashlib
from json import dumps, dump
from typing import List, Dict, Tuple
from pathlib import Path
from os import makedirs, listdir
from copy import deepcopy

from yaml import load
from markdown import markdown
from emoji import emojize
from jinja2 import Template


def get_card_files(card_dir: str = "./cards") -> List[Path]:
    """ returns list of files relative to script
        ex: cards/david.yaml

    :card_dir: relative path to cards dir
    :returns: list of path objects

    """
    p: Path = Path(card_dir)
    return list(p.glob('**/*.yaml'))


def render_note(note: str) -> str:
    """ renders a note into HTML

    :note: str: the raw markdown, non-emoji note
    :returns: str: HTML string with emojis

    """
    note = emojize(note)
    note = markdown(note, extensions=['nl2br'])
    return note


def render_yaml_file(yaml: Dict) -> Tuple[str, str]:
    """TODO: Docstring for render_yaml_file.

    :path: TODO
    :returns: None

    """
    # TODO: render newlines as separate paragraphs
    yaml['note'] = render_note(yaml['note'])
    return render_page(path.stem, yaml)


def render_page(path: str, info: Dict, output: Path = None) -> Tuple[str, str]:
    """ creates the `dist` directory if not already there,
        and renders the card page into `dist/path/`

    :path: str: path into which the card page is rendered
    :info: Dict: jinja2 context

    """
    if not output:
        output = Path('.') / 'dist' / path
    # Import SVGs
    svgs = dict()
    for filename in listdir('./template/assets/'):
        if filename[-4:] != ".svg":
            continue
        svgs[filename[:-4]] = open(Path('./template/assets') / filename, 'r').read()
    # tree: str = open('./template/assets/tree.svg', 'r').read()
    card_template: Template = Template(open('./template/index.html').read())
    card_html: str = card_template.render(svgs=svgs, json=dumps(info), **info)

    token: str = hashlib.sha256(info['note'].encode('utf-8')).hexdigest()
    correct: str = hashlib.sha256(token.encode('utf-8')).hexdigest()

    auth_template: Template = Template(open('./template/auth.html').read())
    auth_html: str = auth_template.render(correct=correct)

    makedirs(output, exist_ok=True)
    with open(output / 'index.html', 'w') as f:
        f.write(auth_html)

    card_output = Path('.') / 'dist' / token
    makedirs(card_output, exist_ok=True)
    with open(card_output / 'index.html', 'w') as f:
        f.write(card_html)

    return (path, token)


def get_email_destination(name: str, email: str, link: str) -> Dict:
    data = {
            "name": name,
            "link": link
            }
    destination: Dict = {
            "Destination": {
                "ToAddresses": [email]
                },
            "ReplacementTemplateData": dumps(data)
    }
    return destination


paths: List[Path] = get_card_files()
mail: Dict = {
        "Source": "Naitian (Holiday Edition) <happy@naitian.holiday>",
        "Template": "naitian-holiday_card",
        "Destinations": [],
        "DefaultTemplateData": dumps({
            "name": "friend",
            "link": "#"
        })
    }
test_mail: Dict = deepcopy(mail)
for path in paths:
    yaml: Dict = load(open(str(path)).read())
    url, token = render_yaml_file(yaml)
    link = 'http://naitian.holiday/{}/?auth_token={}'.format(url, token)
    print(link)
    destination: Dict = get_email_destination(name=yaml["name"],
                                              email=yaml["email"],
                                              link=link)
    mail["Destinations"].append(destination)
    test_dest = deepcopy(destination)
    test_dest["Destination"]["ToAddresses"] = ["test-holiday@naitian.org"]
    test_mail["Destinations"].append(test_dest)

dump(mail, open('./mail/bulk_templated_email.json', 'w'))
dump(test_mail, open('./mail/test_bulk_templated_email.json', 'w'))
