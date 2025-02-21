import React from "react";

const TableCreated = ({ createdAt }) => {
  // If createdAt is a Firestore Timestamp, use toDate()
  let createdDate;
  if (createdAt && typeof createdAt.toDate === "function") {
    createdDate = createdAt.toDate();
  } else if (typeof createdAt === "string") {
    // Replace dashes with slashes for iOS compatibility
    createdDate = new Date(createdAt.replace(/-/g, "/"));
  } else {
    createdDate = new Date(createdAt);
  }

  // Validate date
  if (isNaN(createdDate.getTime())) {
    return <p style={{ fontSize: "14px", color: "#999" }}>Invalid Date</p>;
  }

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
