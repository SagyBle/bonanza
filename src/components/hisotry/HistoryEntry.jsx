import React from "react";
import { HistoryObjectTypes } from "../../constants/enums/history.enum";
import { formatDate } from "../../utils/timeParsing.utils";

const HistoryEntry = ({ entry }) => {
  const formattedTime =
    // entry.timestamp?.seconds !== undefined
    //   ? new Date(entry.timestamp.seconds * 1000).toLocaleString("he-IL")
    //   : "Invalid Date";
    formatDate(entry.timestamp);

  const entryStyles =
    "p-3 bg-gray-50 shadow-sm rounded-lg flex justify-between items-center";

  if (entry.type === HistoryObjectTypes.TABLE_CREATED) {
    return (
      <li className={entryStyles}>
        <span className="text-gray-400 text-sm">{formattedTime}</span>
        <span className="font-medium text-right">השולחן נוצר</span>
      </li>
    );
  } else if (entry.type === HistoryObjectTypes.PLAYER_ADDED) {
    return (
      <li className={entryStyles}>
        <span className="text-gray-400 text-sm">{formattedTime}</span>
        <span className="font-medium text-right">
          {entry.playerName} הצטרף לשולחן
        </span>
      </li>
    );
  } else if (entry.type === HistoryObjectTypes.ENTRY_INCREASED) {
    return (
      <li className={entryStyles}>
        <span className="text-gray-400 text-sm">{formattedTime}</span>
        <span className="font-medium text-right">
          {entry.playerName} כניסה{" "}
          <span className="font-bold">{entry.updatedEntries}</span>
        </span>
      </li>
    );
  } else if (entry.type === HistoryObjectTypes.ENTRY_DECREASED) {
    return (
      <li className={entryStyles}>
        <span className="text-gray-400 text-sm">{formattedTime}</span>
        <span className="font-medium text-right">
          תיקון מנהל - {entry.playerName} כניסה{" "}
          <span className="font-bold">{entry.updatedEntries}</span>
        </span>
      </li>
    );
  } else if (entry.type === HistoryObjectTypes.PLAYER_DELETED) {
    return (
      <li className={entryStyles}>
        <span className="text-gray-400 text-sm">{formattedTime}</span>
        <span className="font-medium text-right">
          תיקון מנהל - {entry.playerName} כניסה{" "}
          <span className="font-bold">{entry.updatedEntries}</span>
        </span>
      </li>
    );
  } else {
    return (
      <li className={entryStyles}>
        <span className="text-gray-400 text-sm">{formattedTime}</span>
        <span className="text-red-500 text-right">
          {entry.type} is not yet supported
        </span>
      </li>
    );
  }
};

export default HistoryEntry;
