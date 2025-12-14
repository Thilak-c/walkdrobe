"use client";

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "default" }) {
  const colors = {
    default: {
      bg: "bg-gray-50",
      icon: "bg-gray-100 text-gray-600",
      trend: "text-gray-500"
    },
    success: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      trend: "text-emerald-600"
    },
    warning: {
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      trend: "text-amber-600"
    },
    danger: {
      bg: "bg-red-50",
      icon: "bg-red-100 text-red-600",
      trend: "text-red-600"
    },
    primary: {
      bg: "bg-gray-900",
      icon: "bg-white/20 text-white",
      trend: "text-white/70"
    },
  };

  const colorSet = colors[color] || colors.default;
  const isPrimary = color === "primary";

  return (
    <div className={`
      ${colorSet.bg} rounded-2xl p-5 transition-all duration-300 card-hover
      ${isPrimary ? "text-white" : ""}
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorSet.icon}`}>
          {Icon && <Icon size={22} />}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${colorSet.trend}`}>
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className={`text-2xl font-bold font-poppins ${isPrimary ? "text-white" : "text-gray-900"}`}>
          {value}
        </p>
        <p className={`text-sm mt-1 ${isPrimary ? "text-white/70" : "text-gray-500"}`}>
          {title}
        </p>
        {subtitle && (
          <p className={`text-xs mt-2 ${isPrimary ? "text-white/50" : "text-gray-400"}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
