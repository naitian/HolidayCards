# The Card Declarations Go Here!

Each card has a .yaml file

Filename is the url / subdomain (haven't figured that out yet).

If you're using Google photos for the image URLs (like me, because I'm lazy),
you want to make an album with all the photos in them and turn on link sharing.

Example `person.yaml`:

```yaml

email: test@naitian.org
name: Nathan Joe
note: >
    Here is a note, with multiple lines. Write something meaningful
    in here. One newline doesn't have any effect, it just breaks
    the line.

    Two newlines (one blank line) inserts a newline. This will be
    interpreted as a new paragraph.
signoff: Best, # comma needs to be here
song: # link to mp3 that plays softly in the background
images:
    - url: # link to photo
      motion_url: # link to video (that plays on hover)
      caption: Something fun you want to say
```
