This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Getting Started

Its implemented using React , Next with tailwind css.

### Setup:

First, clone the repo
```bash
git clone https://github.com/marvelpokemaster/nulltrace_react.git
```
Second, cd to the repo's frontend folder
```
cd nulltrace_react
```

## Frontend:
First, cd to the repo's frontend folder
```
cd ./frontend
```

Second, install dependencies using [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm):
```bash
npm install
```

Third, run the development server:
```bash
npm run dev
```

## Backend:
- The backend is implemented here using Flask .

- Although it might seem to hold water , sadly it doesn't .

- It holds something much greater than water ; It holds <u>**python**</u> code which allows connection to various important services like AI sentiment analysis using <u>textblob</u> which is a powerful python library

backend is stored at `./flask_backend`
frontend is stored at `./flask_backend`

### Setup:

First, cd to the backend folder
```bash
cd ./flask_backend
```

Second, setup venv
```
pyhton -m venv venv
source ./venv/bin/activate
```
Third, install dependencies
```
pip install -r requirements.txt
```

sql wont work normally

Fourth run the sql 
```bash
psql -U postgres -f db.sql
```

Fifth, deploy backend
```
python3 app.py
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# note
- api is irrelevant
- You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
- Basically everything important we modify for the UI is inside the /app folder , we have api handling the js . That is the non-markup part (logical) part of the code.
- Each folder under app serves as an endpoint eg: http://localhost:3000/feedback
- please dont push changes to main branch without prior consultation with @marvelpokemaster

-------------------------------------------------------------------------------------------------------------------------------------------------------------------
