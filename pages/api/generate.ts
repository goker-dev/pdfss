const chrome = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

const queryStringfy = (query:object) => (Object.entries(query).map(([k, v])=>`${k}=${v}`)).join('&')

// const isLinux = process.platform === "linux";
// const LINUX_CHROMIUM = "/usr/bin/chromium-browser";
// const WINDOWS_CHROME = `C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`;

export default async function generate(
  req: {
    query: any
    headers: {token: string}
  },
  res: any
) {
  // const {_id, name, email, comment} = JSON.parse(req.body)

  const {type='pdf', template='dashboard', ...query} = req.query
  // const type = req.query.type || 'pdf'
  // const template = req.query.template || 'dashboard'
  // const client_id = req.query.client_id
  // const url_id = req.query.url_id
  const url = `${process.env.TEMPLATE_URL}?${queryStringfy(query)}`
  console.log({url})
  const token = req.headers.token || process.env.TOKEN
  const browser = await puppeteer.launch(
    process.env.AWS_EXECUTION_ENV
      ? {
          args: chrome.args,
          executablePath: await chrome.executablePath,
          headless: chrome.headless,
        }
      : {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1024,1024',
            '--disable-dev-shm-usage',
            '--unlimited-storage',
            '--full-memory-crash-report',
          ],
          executablePath:
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        }
  )
  //{
  //     args: ['--window-size=1920,1080'],
  //   }
  const page = await browser.newPage()
  await page.setViewport({
    width: 1024,
    height: 1024,
    deviceScaleFactor: 2,
  })
  // await page._client.send('Emulation.clearDeviceMetricsOverride')
  const cookies = [
    {
      name: 'access',
      value: token,
      domain: process.env.COOKIE_DOMAIN,
    },
    {
      name: 'refresh',
      value: token,
      domain: process.env.COOKIE_DOMAIN,
    },
  ]
  await page.setCookie(...cookies)
  // const cookiesSet = await page.cookies(url);
  await page.goto(url, {waitUntil: 'networkidle2'})

  // await page.goto(
  //   ('file://' + __dirname + '/templates/sample.html').replace(
  //     /dist\//,
  //     ''
  //   )
  // )
  await page.waitForTimeout(4000)
  // await page.waitForTimeout(3000)
  // await page.waitForNetworkIdle()
  // await page.setDefaultNavigationTimeout(3000)
  // await page.emulateMediaType('screen')
  // let height = await page.evaluate(() => {
  //   return document.getElementsByTagName('html')[0].offsetHeight
  // })
  // const root = await page.$('#root')

  // const bitmap = await page.screenshot({
  //   path: 'ss.png',
  //   // clip: {x: 0, y: 0, width: 1024, height},
  //   fullPage: true,
  // })
  // // const bitmap = await root.screenshot()
  // const ss =
  //   'data:image/png;base64,' +
  //   new Buffer(bitmap).toString('base64')
  // await page.goto(ss, {waitUntil: 'networkidle2'})
  const pdfBuffer = await page.pdf({
    printBackground: true,
    format: 'letter',
    // width: '1024px',
    // height: '1024px',
    // preferCSSPageSize: true,
    margin: {top: 16, right: 16, bottom: 16, left: 16},
    // pageRanges: '1',
    // scale: 1,
  })

  await browser.close()

  // try {
  //   await client.create({
  //     _type: 'comment',
  //     post: {
  //       _type: 'reference',
  //       _ref: _id,
  //     },
  //     name,
  //     email,
  //     comment,
  //   })
  // } catch (err) {
  //   console.error(err)
  //   return res
  //     .status(500)
  //     .json({message: `Couldn't submit comment`, err})
  // }
  // res.setHeader('Content-Type', 'image/pdf')
  // res.setHeader(
  //     'Content-Disposition',
  //     'attachment; filename=dashboard.pdf'
  // )
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=dashboard.pdf'
  )
  res.write(pdfBuffer, 'binary')
  res.end()
  // return res.status(200).json({message: 'Comment submitted'})
}

//
// curl 'https://pdfs.vercel.app/api/generate?client_id=100508&url_id=101253' \
//   -H 'token:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NTAzNjkyNDAsImV4cCI6MTY1MDM3Mjg0MCwibWF4X2FnZSI6MzYwMCwidHlwZSI6ImFjY2VzcyIsInJ1bnRpbWVfZW52aXJvbm1lbnQiOiJzdGFnaW5nIiwidXNlciI6eyJlbWFpbCI6ImRlbW9AZXZldC5jb20iLCJ1c2VybmFtZSI6ImRlbW9AZXZldC5jb20iLCJpZCI6MiwiZmlyc3RfbmFtZSI6IlNhYnJpIiwibGFzdF9uYW1lIjoiXHUwMGQ2emdcdTAwZmNyIiwiaXNfdmVyaWZpZWQiOnRydWUsImN1c3RvbV9hdHRyaWJ1dGVzIjp7fSwicHJvZHVjdHMiOlt7InVzZXJfcHJvZHVjdF9pZCI6MSwiaWQiOjIsIm5hbWUiOiJOZXR3b3JrIiwicmVkaXJlY3RfdXJsIjoiaHR0cHM6Ly9uZXR3b3JrLnN0YWdpbmcuZXZldC5jb20vIiwiY2Fub25pY2FsX25hbWUiOiJHSE9TVCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsiY2xpZW50X2lkIjoxLCJ1c2VyX3JvbGUiOiJPV05FUiIsInVzZXJfdHlwZSI6IlBVQkxJU0hFUiIsImNsaWVudF9uYW1lIjoiU3VyZm15YWRzIiwiY2xpZW50X3N0YXR1cyI6IkpPSU5FRCJ9fSx7InVzZXJfcHJvZHVjdF9pZCI6ODUsImlkIjo0LCJuYW1lIjoiQ29ubmVjdCIsInJlZGlyZWN0X3VybCI6Imh0dHA6Ly9jb25uZWN0LnN0YWdpbmcuZXZldC5jb20iLCJjYW5vbmljYWxfbmFtZSI6IlZPUlRFWCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnt9fSx7InVzZXJfcHJvZHVjdF9pZCI6NzQsImlkIjoxLCJuYW1lIjoiR3VhcmQiLCJyZWRpcmVjdF91cmwiOiJodHRwczovL3NlYXJjaGNvbXBsaWFuY2Uuc3RhZ2luZy5ldmV0LmNvbS8iLCJjYW5vbmljYWxfbmFtZSI6IlNFQ1JFVE9ORSIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsidXNlcl9pZCI6OTA4LCJjbGllbnRfaWQiOjEwMDUwOCwiY2xpZW50X25hbWUiOiJTYWx2YXRvcmUgRmVycmFnYW1vIiwidXNlcl9yb2xlX2NkIjoiT1dORVIiLCJjbGllbnRfc3RhdHVzIjoiUEFJRCJ9fV0sIm1haW5fcHJvZHVjdF9pZCI6Mn19.SFN4OuC2FwbRmHBC1NykJnfBN46uc9Qa5SvaYhR_p-o' \
//   --compressed
//
// curl 'https://pdfs.vercel.app/api/generate?client_id=100508&url_id=101253' \
//   -H 'token:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NTAzNjQ1NzksImV4cCI6MTY1MDM2ODE3OSwibWF4X2FnZSI6MzYwMCwidHlwZSI6ImFjY2VzcyIsInJ1bnRpbWVfZW52aXJvbm1lbnQiOiJzdGFnaW5nIiwidXNlciI6eyJlbWFpbCI6ImRlbW9AZXZldC5jb20iLCJ1c2VybmFtZSI6ImRlbW9AZXZldC5jb20iLCJpZCI6MiwiZmlyc3RfbmFtZSI6IlNhYnJpIiwibGFzdF9uYW1lIjoiXHUwMGQ2emdcdTAwZmNyIiwiaXNfdmVyaWZpZWQiOnRydWUsImN1c3RvbV9hdHRyaWJ1dGVzIjp7fSwicHJvZHVjdHMiOlt7InVzZXJfcHJvZHVjdF9pZCI6MSwiaWQiOjIsIm5hbWUiOiJOZXR3b3JrIiwicmVkaXJlY3RfdXJsIjoiaHR0cHM6Ly9uZXR3b3JrLnN0YWdpbmcuZXZldC5jb20vIiwiY2Fub25pY2FsX25hbWUiOiJHSE9TVCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsiY2xpZW50X2lkIjoxLCJ1c2VyX3JvbGUiOiJPV05FUiIsInVzZXJfdHlwZSI6IlBVQkxJU0hFUiIsImNsaWVudF9uYW1lIjoiU3VyZm15YWRzIiwiY2xpZW50X3N0YXR1cyI6IkpPSU5FRCJ9fSx7InVzZXJfcHJvZHVjdF9pZCI6ODUsImlkIjo0LCJuYW1lIjoiQ29ubmVjdCIsInJlZGlyZWN0X3VybCI6Imh0dHA6Ly9jb25uZWN0LnN0YWdpbmcuZXZldC5jb20iLCJjYW5vbmljYWxfbmFtZSI6IlZPUlRFWCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnt9fSx7InVzZXJfcHJvZHVjdF9pZCI6NzQsImlkIjoxLCJuYW1lIjoiR3VhcmQiLCJyZWRpcmVjdF91cmwiOiJodHRwczovL3NlYXJjaGNvbXBsaWFuY2Uuc3RhZ2luZy5ldmV0LmNvbS8iLCJjYW5vbmljYWxfbmFtZSI6IlNFQ1JFVE9ORSIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsidXNlcl9pZCI6OTA4LCJjbGllbnRfaWQiOjEwMDUwOCwiY2xpZW50X25hbWUiOiJTYWx2YXRvcmUgRmVycmFnYW1vIiwidXNlcl9yb2xlX2NkIjoiT1dORVIiLCJjbGllbnRfc3RhdHVzIjoiUEFJRCJ9fV0sIm1haW5fcHJvZHVjdF9pZCI6Mn19.UI-dUymgzkCLF0pYKBS05DAALXM_YlXfkTKOvk7-zfc' \
//   --compressed --output dashboard.pdf
