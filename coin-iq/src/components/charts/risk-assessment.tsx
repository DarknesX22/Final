'use client';

import { motion } from '@/components/providers';

interface RiskAssessmentProps {
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  title?: string;
}

export default function RiskAssessment({ 
  riskLevel, 
  confidence, 
  title = 'Risk Assessment' 
}: RiskAssessmentProps) {
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getRiskBgColor = () => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'high': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getRiskText = () => {
    switch (riskLevel) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex flex-col items-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${getRiskBgColor()} border-2 ${riskLevel === 'low' ? 'border-green-500' : riskLevel === 'medium' ? 'border-yellow-500' : 'border-red-500'}`}>
          <span className={`text-2xl font-bold ${getRiskColor()}`}>
            {getRiskText().charAt(0)}
          </span>
        </div>
        <p className={`text-lg font-medium ${getRiskColor()}`}>
          {getRiskText()}
        </p>
        <div className="mt-4 w-full">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Confidence</span>
            <span className="text-sm font-medium">{confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              className={`h-2.5 rounded-full ${
                confidence > 70 ? 'bg-green-500' : 
                confidence > 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            ></motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}