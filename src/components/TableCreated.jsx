import React from "react";

const TableCreated = ({ createdAt }) => {
  const createdDate = new Date(createdAt);
  const today = new Date();

  const isToday = createdDate.toDateString() === today.toDateString();

  const formattedDate = isToday
    ? `נוצר היום בשעה ${createdDate.toLocaleTimeString("he-IL")}`
    : `נוצר ב${createdDate.toLocaleDateString(
        "he-IL"
      )} בשעה ${createdDate.toLocaleTimeString("he-IL")}`;

  return <p style={{ fontSize: "14px", color: "#999" }}>{formattedDate}</p>;
};

export default TableCreated;
