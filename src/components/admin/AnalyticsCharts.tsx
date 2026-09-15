import { useEffect, useState } from 'react'
import { HorizontalBarChart } from '../charts/HorizontalBarChart'
import { SegmentDonutChart } from '../charts/SegmentDonutChart'
import {
  getDistributionBeneficiaryTotal,
  getDistributionByProgramChartData,
  getDistributionStatusChartData,
  getProgramMatchChartData,
  getRequestStatusChartData,
  getRequestStatusTotal,
} from '../../services/analyticsData'
import { subscribeDecisionStorage } from '../../services/decisionStorage'

export function AnalyticsCharts() {
  const [, setTick] = useState(0)

  useEffect(() => {
    return subscribeDecisionStorage(() => setTick((value) => value + 1))
  }, [])

  const requestStatus = getRequestStatusChartData()
  const programMatch = getProgramMatchChartData()
  const distributionStatus = getDistributionStatusChartData()
  const distributionByProgram = getDistributionByProgramChartData()

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900">Request Status</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Breakdown of assistance requests by current review status.
          </p>
        </div>
        <SegmentDonutChart
          segments={requestStatus}
          centerValue={getRequestStatusTotal()}
          centerLabel="Total Requests"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900">Program Match</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Top AI-matched programs ranked by vulnerability match score.
          </p>
        </div>
        <HorizontalBarChart items={programMatch} maxValue={100} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900">Distribution Overview</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Disbursement status and beneficiaries served per program.
          </p>
        </div>
        <SegmentDonutChart
          segments={distributionStatus}
          centerValue={getDistributionBeneficiaryTotal()}
          centerLabel="Beneficiaries"
        />
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase text-gray-400">
            Beneficiaries by Program
          </p>
          <HorizontalBarChart items={distributionByProgram} />
        </div>
      </div>
    </div>
  )
}
