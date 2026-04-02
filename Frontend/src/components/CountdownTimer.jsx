export default function CountdownTimer() {
    return (
      <div>                                           {/* outer wrapper for the countdown block */}
        <div>                                         {/* inner wrapper for the five time units */}
          <span>03 <small>MONTHS</small></span>       {/* months remaining; <small> is used for the unit label */}
          <span>13 <small>DAYS</small></span>         {/* days remaining */}
          <span>23 <small>HOURS</small></span>        {/* hours remaining */}
          <span>37 <small>MINUTES</small></span>      {/* minutes remaining */}
          <span>59 <small>SECONDS</small></span>      {/* seconds remaining */}
        </div>
      </div>
    );
  }