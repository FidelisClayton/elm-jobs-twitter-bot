const ChartjsNode = require('chartjs-node')
const axios = require('axios')
const moment = require('moment')
const path = require('path')

const getTimePeriod = () => {
  const timePeriod = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ].reduce((previous, month) => {
    const key = moment().subtract(month - 1, 'months').format('MMM/YYYY')

    return {
      ...previous,
      [key]: 0
    }
  }, {})

  return timePeriod
}

const buildNewJobsDatasource = issues => {
  const timePeriod = getTimePeriod()

  const data = issues.reduce((previous, issue) => {
    const key = moment(issue.created_at).format('MMM/YYYY')

    const previousKeyValue = previous[key]

    return {
      ...previous,
      [key]: previousKeyValue + 1
    }
  }, timePeriod)

  return data
}

const buildOpenJobsDatasource = issues => {
  const timePeriod = getTimePeriod()

  const data = issues.reduce((previous, issue) => {
    const key = moment(issue.created_at).format('MMM/YYYY')
    const [ month, year ] = key.split('/')

    const currentDateLimit = moment(`${year}-${month}-1`).endOf('month')

    const previousKeyValue = previous[key]
    const openJobs =
      issues
        .filter(issue => issue.closed_at === null)
        .filter(issue => {
          const date = moment(issue.created_at)
          const diff = date.diff(currentDateLimit)

          return diff <= 0
        })
        .length

    return {
      ...previous,
      [key]: openJobs
    }
  }, timePeriod)

  return data
}

const buildDatasource = issues => {
  const newJobs = buildNewJobsDatasource(issues)
  const openJobs = buildOpenJobsDatasource(issues)

  return {
    newJobs,
    openJobs
  }
}

const buildChartOptions = data => {
  const labels = Object.keys(data.newJobs).reverse()
  const newJobs = Object.values(data.newJobs).reverse()
  const openJobs = Object.values(data.openJobs).reverse()

  return {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "# of open jobs",
          data: openJobs,
          backgroundColor: "rgba(255, 0, 0, 0.2)",
          borderColor: "rgba(255, 0, 0, 1)",
          borderWidth: 1
        },
        {
          label: "# of new job posts",
          data: newJobs,
          backgroundColor: "rgba(0, 255, 0, 0.2)",
          borderColor: "rgba(0, 255, 0, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Job posts history @elmjobs_'
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            stepSize: 1
          }
        }]
      }
    }
  }
}

const buildChart = chartOptions => {
  const chartNode = new ChartjsNode(1000, 500)
  const imagePath = path.join(__dirname, 'tmp', 'chart.png')

  return chartNode.drawChart(chartOptions)
    .then(() => chartNode.getImageBuffer('image/png'))
    .then(buffer => chartNode.getImageStream('image/png'))
    .then(streamResult => chartNode.writeImageToFile('image/png', imagePath))
    .then(() => console.log(`Chart built at ${moment().format('DD/MM/YYYY')}`))
}

module.exports = () => {
  console.log('Building chart')

  return axios.get('https://api.github.com/repos/fidelisclayton/elm-jobs/issues?state=all')
    .then(({ data }) => data)
    .then(buildDatasource)
    .then(buildChartOptions)
    .then(buildChart)
    .catch(error => {
      console.log('error', error)

      return new Error(error)
    })
}
