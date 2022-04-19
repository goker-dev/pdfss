const chrome = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

export default async function generate(
  req: {
    query: {
      client_id: number
      url_id: number
      template?: string
      type?: string
    }
    headers: {token: string}
  },
  res: any
) {
  // const {_id, name, email, comment} = JSON.parse(req.body)
  const type = req.query.type || 'pdf'
  const template = req.query.template || 'dashboard'
  const client_id = req.query.client_id
  const url_id = req.query.url_id
  const url = `${process.env.TEMPLATE_URL}?client_id=${client_id}&url_id=${url_id}`
  const token = req.headers.token || process.env.TOKEN
  const browser = await puppeteer.launch(
    process.env.AWS_EXECUTION_ENV
      ? {
          args: chrome.args,
          executablePath: await chrome.executablePath,
          headless: chrome.headless,
        }
      : {
          args: [],
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
    height: 768,
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
  await page.goto(url)

  // await page.goto(
  //   ('file://' + __dirname + '/templates/sample.html').replace(
  //     /dist\//,
  //     ''
  //   )
  // )
  // await page.waitForTimeout(2000)
  await page.waitForNetworkIdle()
  await page.emulateMediaType('screen')
  // await page.screenshot({path: 'ss.png'})
  const pdfBuffer = await page.pdf({
    printBackground: true,
    // width: '800px',
    // height: '768px',
    // preferCSSPageSize: false,
    // margin: {top: 0, right: 0, bottom: 0, left: 0},
    pageRanges: '1-2',
    // scale:.5
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
//   -H 'token:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NTAzNjQ1NzksImV4cCI6MTY1MDM2ODE3OSwibWF4X2FnZSI6MzYwMCwidHlwZSI6ImFjY2VzcyIsInJ1bnRpbWVfZW52aXJvbm1lbnQiOiJzdGFnaW5nIiwidXNlciI6eyJlbWFpbCI6ImRlbW9AZXZldC5jb20iLCJ1c2VybmFtZSI6ImRlbW9AZXZldC5jb20iLCJpZCI6MiwiZmlyc3RfbmFtZSI6IlNhYnJpIiwibGFzdF9uYW1lIjoiXHUwMGQ2emdcdTAwZmNyIiwiaXNfdmVyaWZpZWQiOnRydWUsImN1c3RvbV9hdHRyaWJ1dGVzIjp7fSwicHJvZHVjdHMiOlt7InVzZXJfcHJvZHVjdF9pZCI6MSwiaWQiOjIsIm5hbWUiOiJOZXR3b3JrIiwicmVkaXJlY3RfdXJsIjoiaHR0cHM6Ly9uZXR3b3JrLnN0YWdpbmcuZXZldC5jb20vIiwiY2Fub25pY2FsX25hbWUiOiJHSE9TVCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsiY2xpZW50X2lkIjoxLCJ1c2VyX3JvbGUiOiJPV05FUiIsInVzZXJfdHlwZSI6IlBVQkxJU0hFUiIsImNsaWVudF9uYW1lIjoiU3VyZm15YWRzIiwiY2xpZW50X3N0YXR1cyI6IkpPSU5FRCJ9fSx7InVzZXJfcHJvZHVjdF9pZCI6ODUsImlkIjo0LCJuYW1lIjoiQ29ubmVjdCIsInJlZGlyZWN0X3VybCI6Imh0dHA6Ly9jb25uZWN0LnN0YWdpbmcuZXZldC5jb20iLCJjYW5vbmljYWxfbmFtZSI6IlZPUlRFWCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnt9fSx7InVzZXJfcHJvZHVjdF9pZCI6NzQsImlkIjoxLCJuYW1lIjoiR3VhcmQiLCJyZWRpcmVjdF91cmwiOiJodHRwczovL3NlYXJjaGNvbXBsaWFuY2Uuc3RhZ2luZy5ldmV0LmNvbS8iLCJjYW5vbmljYWxfbmFtZSI6IlNFQ1JFVE9ORSIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsidXNlcl9pZCI6OTA4LCJjbGllbnRfaWQiOjEwMDUwOCwiY2xpZW50X25hbWUiOiJTYWx2YXRvcmUgRmVycmFnYW1vIiwidXNlcl9yb2xlX2NkIjoiT1dORVIiLCJjbGllbnRfc3RhdHVzIjoiUEFJRCJ9fV0sIm1haW5fcHJvZHVjdF9pZCI6Mn19.UI-dUymgzkCLF0pYKBS05DAALXM_YlXfkTKOvk7-zfc' \
//   --compressed
//
// curl 'https://pdfs.vercel.app/api/generate?client_id=100508&url_id=101253' \
//   -H 'token:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NTAzNjQ1NzksImV4cCI6MTY1MDM2ODE3OSwibWF4X2FnZSI6MzYwMCwidHlwZSI6ImFjY2VzcyIsInJ1bnRpbWVfZW52aXJvbm1lbnQiOiJzdGFnaW5nIiwidXNlciI6eyJlbWFpbCI6ImRlbW9AZXZldC5jb20iLCJ1c2VybmFtZSI6ImRlbW9AZXZldC5jb20iLCJpZCI6MiwiZmlyc3RfbmFtZSI6IlNhYnJpIiwibGFzdF9uYW1lIjoiXHUwMGQ2emdcdTAwZmNyIiwiaXNfdmVyaWZpZWQiOnRydWUsImN1c3RvbV9hdHRyaWJ1dGVzIjp7fSwicHJvZHVjdHMiOlt7InVzZXJfcHJvZHVjdF9pZCI6MSwiaWQiOjIsIm5hbWUiOiJOZXR3b3JrIiwicmVkaXJlY3RfdXJsIjoiaHR0cHM6Ly9uZXR3b3JrLnN0YWdpbmcuZXZldC5jb20vIiwiY2Fub25pY2FsX25hbWUiOiJHSE9TVCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsiY2xpZW50X2lkIjoxLCJ1c2VyX3JvbGUiOiJPV05FUiIsInVzZXJfdHlwZSI6IlBVQkxJU0hFUiIsImNsaWVudF9uYW1lIjoiU3VyZm15YWRzIiwiY2xpZW50X3N0YXR1cyI6IkpPSU5FRCJ9fSx7InVzZXJfcHJvZHVjdF9pZCI6ODUsImlkIjo0LCJuYW1lIjoiQ29ubmVjdCIsInJlZGlyZWN0X3VybCI6Imh0dHA6Ly9jb25uZWN0LnN0YWdpbmcuZXZldC5jb20iLCJjYW5vbmljYWxfbmFtZSI6IlZPUlRFWCIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnt9fSx7InVzZXJfcHJvZHVjdF9pZCI6NzQsImlkIjoxLCJuYW1lIjoiR3VhcmQiLCJyZWRpcmVjdF91cmwiOiJodHRwczovL3NlYXJjaGNvbXBsaWFuY2Uuc3RhZ2luZy5ldmV0LmNvbS8iLCJjYW5vbmljYWxfbmFtZSI6IlNFQ1JFVE9ORSIsImlzX2FkbWluIjpmYWxzZSwiY3VzdG9tX2F0dHJpYnV0ZXMiOnsidXNlcl9pZCI6OTA4LCJjbGllbnRfaWQiOjEwMDUwOCwiY2xpZW50X25hbWUiOiJTYWx2YXRvcmUgRmVycmFnYW1vIiwidXNlcl9yb2xlX2NkIjoiT1dORVIiLCJjbGllbnRfc3RhdHVzIjoiUEFJRCJ9fV0sIm1haW5fcHJvZHVjdF9pZCI6Mn19.UI-dUymgzkCLF0pYKBS05DAALXM_YlXfkTKOvk7-zfc' \
//   --compressed --output dashboard.pdf
