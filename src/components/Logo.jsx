import React from "react";

function Logo({ width = "100px" }) {
  return (
    <div style={{ width }} className="flex items-center">
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-500 cursor-pointer transform hover:scale-105">
        MegaBlog
      </span>
    </div>
  );
}

export default Logo;
