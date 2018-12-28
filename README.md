# HolidayCards

> An exercise in over-engineering

This is the holiday card system I used for my 2018 holiday cards.

## Features

- Each card is stored as a YAML file
- Uses Amazon SES (simple email service) to email out links
- Requires authorization token to access the page for the first time,
after which the token is stored in localstorage.
- Generates static files, hosted on S3
- Pretty URLs
