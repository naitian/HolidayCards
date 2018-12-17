import hashlib
from typing import List, Dict
from pathlib import Path
from os import makedirs

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


def render_yaml_file(path: Path) -> None:
    """TODO: Docstring for render_yaml_file.

    :path: TODO
    :returns: None

    """
    # TODO: render newlines as separate paragraphs
    yaml: Dict = load(open(str(path)).read())
    yaml['note'] = render_note(yaml['note'])
    render_page(path.stem, yaml)


def render_page(path: str, info: Dict, output: Path = None):
    """ creates the `dist` directory if not already there,
        and renders the card page into `dist/path/`

    :path: str: path into which the card page is rendered
    :info: Dict: jinja2 context

    """
    if not output:
        output = Path('.') / 'dist' / path
    tree: str = open('./template/assets/tree.svg', 'r').read()
    card_template: Template = Template(open('./template/index.html').read())
    card_html: str = card_template.render(tree=tree, **info)

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

    print(path)
    print(token)


paths: List[Path] = get_card_files()
for path in paths:
    render_yaml_file(path)
