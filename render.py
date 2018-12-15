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
    note = markdown(note)
    return note


def render_yaml_file(path: Path):
    """TODO: Docstring for render_yaml_file.

    :path: TODO
    :returns: TODO

    """
    yaml: Dict = load(open(str(path)).read())
    yaml['note'] = render_note(yaml['note'])
    render_file(path.stem, yaml)


def render_file(path: str, info: Dict):
    """ creates the `dist` directory if not already there,
        and renders the card page into `dist/path/`

    :path: str: path into which the card page is rendered
    :info: Dict: jinja2 context

    """
    output: Path = Path('.') / 'dist' / path
    makedirs(output, exist_ok=True)
    template: Template = Template(open('./template/index.html').read())
    html: str = template.render(**info)
    with open(output / 'index.html', 'w') as f:
        f.write(html)
    print(path)
    print(info)


paths: List[Path] = get_card_files()
render_yaml_file(paths[0])
