const Workshift = require("../workshift/model");
const { weeknum } = require("../workshift/controller");

async function changeScheduleTime() {
    try {
      const week = weeknum();
      const workshifts = await Workshift.find({ shift_type: "Schedule" });
      workshifts.map(async (workshift) => {
        const updateWorkshift = await Workshift.updateOne(
          { _id: workshift?._id },
          {
            $set: {
              shift_clockin: workshift?.schedule[`minggu_${week}`].shift_clockin,
              shift_clockout:
                workshift?.schedule[`minggu_${week}`]?.shift_clockout,
              shift_break_duration:
                workshift?.schedule[`minggu_${week}`]?.shift_break_duration,
              shift_desc: `${workshift?.shift_name} (${
                workshift?.schedule[`minggu_${week}`]?.shift_clockin
              }-${workshift?.schedule[`minggu_${week}`]?.shift_clockout}, ${
                workshift?.schedule[`minggu_${week}`]?.shift_break_duration < 10
                  ? `0${
                      workshift?.schedule[`minggu_${week}`]?.shift_break_duration
                    }:00 Hour`
                  : `${
                      workshift?.schedule[`minggu_${week}`]?.shift_break_duration
                    }:00 Hour`
              })`,
              week_active: `minggu_${week}`,
            },
          }
        );
        console.log(updateWorkshift);
      });
      // console.log(week);
    } catch (error) {
      console.log(error);
    }
  }

try {
    changeScheduleTime();
} catch (error) {
    console.log(error);
}