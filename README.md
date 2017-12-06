# methode-scheduled-publisher
Publish stories on a schedule

In order to run locally:

    - In index.js
        - You will need your own .env file(see: .example_env)
        - Uncomment the main() line at the bottom of the file
        - In your terminal run:
            - npm install
            - npm run dev

In order to run in lambda:

    - In index.js
        - Comment out the "main()" line at the bottom of the file
        - Comment out the "require('dotenv').config();" line at the top of the file
