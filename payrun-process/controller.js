const mongoose = require("mongoose");
const path = require("path");
const PayrunProcess = require("./model");
const Payrun = require("../payrun/model");
const Bank = require("../bank/model");
const PayrunType = require("../payrun-type/model");
const BankPayrun = require("../bank-payrun/model");
const OutputFile = require("../output-file/model");
const Periodic = require("../periodic/model");
const moment = require("moment");
const csvWriter = require("csv-writer");
const CsvParser = require("json2csv").Parser;
const excel = require("exceljs");
require("dotenv").config();
const { getPublicUrl, uploadBuffer } = require("../utils/r2");

module.exports = {
  async getPayrunProcess(req, res) {
    try {
      const { company_id, periodic_id } = req.query;
      const payruns = await Payrun.find()
        .where("company_id", company_id)
        .where("payrun_period", periodic_id)
        .where("payrun_status", "Approve")
        .populate({
          path: "emp_id",
          select:
            "emp_fullname _id emp_depid emp_desid email payrun_status payrun_type",
          populate: [
            {
              path: "emp_depid",
              select: "dep_name",
            },
            {
              path: "emp_desid",
              select: "des_name",
            },
          ],
        })
        .populate({
          path: "payrun_period",
        })
        .populate({
          path: "payrun_type",
          select: "payrun_type _id color",
        });

      const payrunDatas = [];
      await Promise.all(
        payruns.map(async (payrun) => {
          let payrunObj = { payrun };
          const banks = await Bank.find({ emp_id: payrun.emp_id._id });
          if (banks.length) {
            banks.map((bank) => {
              payrunObj = { payrun, bank };
            });
          } else {
            payrunObj = { ...payrunObj, bank: null };
          }

          const bankPayruns = await BankPayrun.find({
            company_id: payrun.company_id,
            is_default: true,
          }).populate({ path: "company_id", select: "company_name" });
          if (bankPayruns.length) {
            bankPayruns.map((bankPayrun) => {
              payrunObj = { ...payrunObj, bankPayrun };
            });
          } else {
            payrunObj = { ...payrunObj, bankPayrun: null };
          }

          payrunDatas.push(payrunObj);
        })
      );

      console.log("payruns", payrunDatas);

      return res.status(200).send({ data: payrunDatas });
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  async createPayrunProcess(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const {
        companyIds,
        outputFile,
        dateTransaction,
        period,
        input,
        rekDebet,
        totalRecord,
        totalAmount,
      } = req.body;

      const findOutputFile = await OutputFile.find({ _id: outputFile });
      if (findOutputFile.length === 0) {
        return res.status(404).send("Output file not found");
      }

      const nowMonth = moment(new Date()).format("MMMM");
      const nowYears = moment(new Date()).format("YYYY");
      const periodics = await Periodic.find({
        company_id: { $in: companyIds },
      });

      if (periodics.length === 0) {
        return res.status(404).send("Periodic not found");
      }

      const filterPeriodic = periodics.filter((period) => {
        return (
          period.periodic_month === nowMonth &&
          period.periodic_years === nowYears
        );
      });

      const periodicIds = filterPeriodic.map((period) => {
        return period._id;
      });

      const payruns = await Payrun.find({
        company_id: { $in: companyIds },
        match: {
          payrun_period: { $in: periodicIds },
        },
        payrun_status: "Approve",
      }).populate({
        path: "emp_id",
        select: "emp_fullname _id emp_depid emp_desid email payrun_status",
        populate: [
          {
            path: "emp_depid",
            select: "dep_name",
          },
          {
            path: "emp_desid",
            select: "des_name",
          },
        ],
      });
      if (payruns.length === 0) {
        return res.status(404).send("Payrun not found");
      }

      const fileName = `${moment(new Date()).format("YYYYMMDD")}_${moment(
        new Date()
      ).format("HHmmss")}`;

      const typeFile = findOutputFile[0].type_file;

      // save to DB
      await Payrun.updateMany(
        {
          company_id: { $in: companyIds },
          payrun_period: { $in: periodicIds },
          payrun_status: "Approve",
        },
        {
          $set: {
            process_date: dateTransaction,
          },
        }
      );
      companyIds.forEach(async (companyId) => {
        const payrunProcessData = {
          company_id: companyId,
          output_file: outputFile,
          period,
          date_transaction: dateTransaction,
          file_name: `${fileName}.${typeFile}`,
        };

        await PayrunProcess.create(payrunProcessData);
      });

      if (typeFile === "csv") {
        const date = `${moment(dateTransaction).format("YYYY/MM/DD")}_${moment(
          dateTransaction
        ).format("HH:mm:ss")}`;
        let csvData =
          [
            date,
            `${totalRecord + 2}`,
            `Gaji ${period}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ].join(",") + "\r\n";
        csvData +=
          [
            input,
            `${moment(dateTransaction).format("YYYY/MM/DD")}`,
            rekDebet,
            totalRecord,
            totalAmount,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ].join(",") + "\r\n";

        if (payruns.length) {
          await Promise.all(
            payruns.map(async (payrun) => {
              if (payrun.emp_id.payrun_status) {
                const banks = await Bank.find({ emp_id: payrun.emp_id._id });
                banks.map((bank) => {
                  csvData +=
                    [
                      bank.bi_account_number,
                      bank.bi_holder_name,
                      payrun.payrun_net_salary,
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "N",
                      "",
                      "",
                      "",
                      "N",
                    ].join(",") + "\r\n";
                });
              }
            })
          );
        }

        const storedPath = `payrun_process/${fileName}.csv`;
        await uploadBuffer({
          folder: "files",
          fileName: storedPath,
          buffer: Buffer.from(csvData, "utf8"),
          contentType: "text/csv",
        });

        await session.commitTransaction();
        return res
          .set({
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename=${fileName}.csv`,
          })
          .status(200)
          .send({
            fileName: `${fileName}.csv`,
            path: storedPath,
            url: getPublicUrl("files", storedPath),
            data: csvData,
            message: "Export to csv successfully",
          });
      } else if (typeFile === "excel") {
        const employees = [];
        if (payruns.length) {
          await Promise.all(
            payruns.map(async (payrun) => {
              const banks = await Bank.find({ emp_id: payrun.emp_id._id });
              banks.map((bank) => {
                const employee = {
                  holderName: bank.bi_holder_name,
                  netSalary: payrun.payrun_net_salary,
                };
                employees.push(employee);
              });
            })
          );
        }

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet(`${fileName}`);

        worksheet.columns = [
          {
            header: "NO",
            key: "number",
            width: 7,
          },
          {
            header: "Nama Penerima",
            key: "name",
            width: 20,
          },
          {
            header: "Nominal",
            key: "nominal",
            width: 20,
          },
        ];
        const xlsxDatas = [];
        let totalAmount = 0;
        employees.forEach((employee, index) => {
          totalAmount += employee.netSalary;
          const xlsxObject = {
            number: index + 1,
            name: employee.holderName,
            nominal: formatCurrency(employee.netSalary),
          };
          xlsxDatas.push(xlsxObject);
        });

        worksheet.addRows(xlsxDatas);
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        const endRow = worksheet.lastRow._number + 1;
        worksheet.getCell(`C${endRow}`).value = formatCurrency(totalAmount);
        worksheet.getRow(endRow).eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        employees.forEach((employee, index) => {
          worksheet.getRow(index + 2).eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });

        function formatCurrency(number) {
          const formatter = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          });
          return formatter.format(Math.round(number));
        }

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + `${fileName}.xlsx`
        );

        const storedPath = `payrun_process/${fileName}.xlsx`;
        const workbookBuffer = await workbook.xlsx.writeBuffer();
        await uploadBuffer({
          folder: "files",
          fileName: storedPath,
          buffer: Buffer.from(workbookBuffer),
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        res.send({
          status: "success",
          message: "file successfully downloaded",
          data: {
            path: storedPath,
            fileName: `${fileName}.xlsx`,
            url: getPublicUrl("files", storedPath),
          },
        });
      }
    } catch (error) {
      await session.abortTransaction();
      if (error.name === "ValidationError") {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
          errors[key] = error.errors[key].message;
        });

        return res.status(400).send(errors);
      }
      return res.status(500).send(error);
    } finally {
      // Ending the session
      await session.endSession();
    }
  },
};
