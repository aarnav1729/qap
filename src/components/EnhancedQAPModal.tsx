// src/components/EnhancedQAPModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QAPSpecification, QAPFormData } from "@/types/qap";
import {
  mqpSpecifications,
  visualElSpecifications,
} from "@/data/qapSpecifications";
import { useAuth } from "@/contexts/AuthContext";

interface EnhancedQAPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (qapData: QAPFormData) => void;
  nextSno: number;
  editingQAP?: QAPFormData | null;
}

const EnhancedQAPModal: React.FC<EnhancedQAPModalProps> = ({
  isOpen,
  onClose,
  onSave,
  nextSno,
  editingQAP,
}) => {
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [productType, setProductType] = useState<string>("");
  const [plant, setPlant] = useState<string>("");

  const [mqpData, setMqpData] = useState<QAPSpecification[]>([]);
  const [visualElData, setVisualElData] = useState<QAPSpecification[]>([]);

  const [step, setStep] = useState<"form" | "assignments">("form");
  const [assignments, setAssignments] = useState<
    Record<
      number,
      { production: boolean; quality: boolean; technical: boolean }
    >
  >({});

  const customerOptions = ["akanksha", "praful", "yamini", "jmr", "cmk"];
  const productOptions = [
    "Dual Glass M10 Perc",
    "Dual Glass M10 Topcon",
    "Dual Glass G12R Topcon",
    "Dual Glass G12 Topcon",
    "M10 Transparent Perc",
  ];
  const plantOptions = ["p2", "p4", "p5"];

  useEffect(() => {
    if (!isOpen) return;
    if (editingQAP) {
      // Populate fields from existing QAP
      setCustomerName(editingQAP.customerName);
      setProjectName(editingQAP.projectName);
      setOrderQuantity(editingQAP.orderQuantity);
      setProductType(editingQAP.productType);
      setPlant(editingQAP.plant);
      setMqpData(editingQAP.qaps.filter((q) => q.criteria === "MQP"));
      setVisualElData(
        editingQAP.qaps.filter(
          (q) => q.criteria === "Visual" || q.criteria === "EL"
        )
      );
      setAssignments(editingQAP.mismatchAssignments || {});
      setStep("form");
    } else {
      // New QAP: reset form and initialize tables
      resetForm();
      initializeQAPData();
      setAssignments({});
      setStep("form");
    }
  }, [isOpen, editingQAP, nextSno]);

  const initializeQAPData = () => {
    setMqpData(
      mqpSpecifications.map((spec, idx) => ({
        ...spec,
        sno: nextSno + idx,
        match: undefined,
        customerSpecification: undefined,
      }))
    );
    setVisualElData(
      visualElSpecifications.map((spec, idx) => ({
        ...spec,
        sno: nextSno + mqpSpecifications.length + idx,
        match: undefined,
        customerSpecification: undefined,
      }))
    );
  };

  const resetForm = () => {
    setCustomerName("");
    setProjectName("");
    setOrderQuantity(0);
    setProductType("");
    setPlant("");
    setMqpData([]);
    setVisualElData([]);
  };

  const handleSave = (isDraft: boolean = true) => {
    const allData = [...mqpData, ...visualElData];
    const now = new Date();

    const qapData: QAPFormData = {
      id: editingQAP?.id || Date.now().toString(),
      customerName,
      projectName,
      orderQuantity,
      productType,
      plant,
      status: isDraft ? "draft" : "level-2",
      submittedBy: user?.username || "unknown",
      submittedAt: isDraft ? undefined : now,
      currentLevel: isDraft ? 1 : 2,
      levelResponses: {},
      timeline: isDraft
        ? []
        : [
            {
              level: 2,
              action: "Submitted for Level 2 review",
              user: user?.username || "unknown",
              timestamp: now,
            },
          ],
      qaps: allData,
      mismatchAssignments: assignments,
      createdAt: editingQAP?.createdAt || now,
      lastModifiedAt: now,
      levelStartTimes: isDraft ? { 1: now } : { 1: now, 2: now },
      levelEndTimes: isDraft ? {} : { 1: now },
    };

    onSave(qapData);
    onClose();
  };

  const handleMatchChange = (
    section: "mqp" | "visual",
    index: number,
    match: "yes" | "no"
  ) => {
    const update = section === "mqp" ? setMqpData : setVisualElData;
    const arr = section === "mqp" ? mqpData : visualElData;
    const newArr = [...arr];
    const spec = newArr[index];
    const defaultSpec = spec.specification || spec.criteriaLimits || "";
    newArr[index] = {
      ...spec,
      match,
      customerSpecification: match === "yes" ? defaultSpec : "",
    };
    update(newArr);
  };

  const handleCustomerSpecChange = (
    section: "mqp" | "visual",
    index: number,
    value: string
  ) => {
    const update = section === "mqp" ? setMqpData : setVisualElData;
    const arr = section === "mqp" ? mqpData : visualElData;
    const newArr = [...arr];
    newArr[index] = { ...newArr[index], customerSpecification: value };
    update(newArr);
  };

  const getRowClassName = (item: QAPSpecification) => {
    if (item.match === "yes") return "bg-green-50 border-green-200";
    if (item.match === "no") return "bg-red-50 border-red-200";
    return "bg-white border-gray-200";
  };

  const renderMQPTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-12">
              S.No
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-20">
              Criteria
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-24">
              Sub Criteria
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-32">
              Component & Operation
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-32">
              Characteristics
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-20">
              Class
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-24">
              Type of Check
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-24">
              Sampling
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-48">
              Specification
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-20">
              Match?
            </th>
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-48">
              Customer Specification
            </th>
          </tr>
        </thead>
        <tbody>
          {mqpData.map((item, idx) => (
            <tr
              key={idx}
              className={`border-b hover:bg-opacity-70 transition-colors ${getRowClassName(
                item
              )}`}
            >
              <td className="border border-gray-300 p-2 sm:p-3 font-medium text-gray-600">
                {item.sno}
              </td>
              <td className="border border-gray-300 p-2 sm:p-3">
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
                >
                  {item.criteria}
                </Badge>
              </td>
              <td className="border border-gray-300 p-2 sm:p-3 max-w-24 break-words">
                {item.subCriteria}
              </td>
              <td className="border border-gray-300 p-2 sm:p-3 max-w-32 break-words">
                {item.componentOperation}
              </td>
              <td className="border border-gray-300 p-2 sm:p-3 max-w-32 break-words">
                {item.characteristics}
              </td>
              <td className="border border-gray-300 p-2 sm:p-3">
                <Badge
                  variant={
                    item.class === "Critical"
                      ? "destructive"
                      : item.class === "Major"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {item.class}
                </Badge>
              </td>
              <td className="border border-gray-300 p-2 sm:p-3 max-w-24 break-words text-xs">
                {item.typeOfCheck}
              </td>
              <td className="border border-gray-300 p-2 sm:p-3 max-w-24 break-words text-xs">
                {item.sampling}
              </td>
              <td className="border border-gray-300 p-2 sm:p-3 max-w-48 break-words font-medium text-gray-700 text-xs">
                {item.specification}
              </td>
              <td className="border border-gray-300 p-2 sm:p-3">
                <Select
                  value={item.match || ""}
                  onValueChange={(v: "yes" | "no") =>
                    handleMatchChange("mqp", idx, v)
                  }
                >
                  <SelectTrigger className="w-16 sm:w-20 h-8">
                    <SelectValue placeholder="?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="border border-gray-300 p-2 sm:p-3">
                <Input
                  value={item.customerSpecification || ""}
                  onChange={(e) =>
                    handleCustomerSpecChange("mqp", idx, e.target.value)
                  }
                  placeholder={
                    item.match === "no"
                      ? "Enter custom specification..."
                      : "Auto-filled from Premier Spec"
                  }
                  disabled={item.match === "yes"}
                  className={`text-xs ${
                    item.match === "yes"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : item.match === "no"
                      ? "bg-red-50 border-red-300"
                      : "bg-white"
                  }`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderVisualElTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
            <th className="border border-gray-300 p-2 sm:p-3 text-left font-semibold text-gray-700 min-w-12">
              S.No
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-20">
              Criteria
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-24">
              Sub-Criteria
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-32">
              Defect
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-20">
              Defect Class
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-48">
              Description
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-48">
              Criteria Limits
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-20">
              Match?
            </th>
            <th className="border border-gray-300 p-2 sm?p-3 text-left font-semibold text-gray-700 min-w-48">
              Customer Specification
            </th>
          </tr>
        </thead>
        <tbody>
          {visualElData.map((item, idx) => (
            <tr
              key={idx}
              className={`border-b hover:bg-opacity-70 transition-colors ${getRowClassName(
                item
              )}`}
            >
              <td className="border border-gray-300 p-2 sm?p-3 font-medium text-gray-600">
                {item.sno}
              </td>
              <td className="border border-gray-300 p-2 sm?p-3">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    item.criteria === "Visual"
                      ? "bg-purple-100 text-purple-800 border-purple-300"
                      : "bg-orange-100 text-orange-800 border-orange-300"
                  }`}
                >
                  {item.criteria}
                </Badge>
              </td>
              <td className="border border-gray-300 p-2 sm?p-3 max-w-24 break-words">
                {item.subCriteria}
              </td>
              <td className="border border-gray-300 p-2 sm?p-3 max-w-32 break-words">
                {item.defect}
              </td>
              <td className="border border-gray-300 p-2 sm?p-3">
                <Badge
                  variant={
                    item.defectClass === "Critical"
                      ? "destructive"
                      : item.defectClass === "Major"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {item.defectClass}
                </Badge>
              </td>
              <td className="border border-gray-300 p-2 sm?p-3 max-w-48 break-words text-xs">
                {item.description}
              </td>
              <td className="border border-gray-300 p-2 sm?p-3 max-w-48 break-words font-medium text-gray-700 text-xs">
                {item.criteriaLimits}
              </td>
              <td className="border border-gray-300 p-2 sm?p-3">
                <Select
                  value={item.match || ""}
                  onValueChange={(v: "yes" | "no") =>
                    handleMatchChange("visual", idx, v)
                  }
                >
                  <SelectTrigger className="w-16 sm+w-20 h-8">
                    <SelectValue placeholder="?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="border border-gray-300 p-2 sm?p-3">
                <Input
                  value={item.customerSpecification || ""}
                  onChange={(e) =>
                    handleCustomerSpecChange("visual", idx, e.target.value)
                  }
                  placeholder={
                    item.match === "no"
                      ? "Enter custom specification..."
                      : "Auto-filled from Criteria Limits"
                  }
                  disabled={item.match === "yes"}
                  className={`text-xs ${
                    item.match === "yes"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : item.match === "no"
                      ? "bg-red-50 border-red-300"
                      : "bg-white"
                  }`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <DialogTitle className="text-2xl font-bold">
            {editingQAP ? "Edit QAP" : "New QAP"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {step === "form" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-blue-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Select value={customerName} onValueChange={setCustomerName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity in MW *</Label>
                  <Input
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                    placeholder="Enter quantity in MW"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Type *</Label>
                  <Select value={productType} onValueChange={setProductType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plant *</Label>
                  <Select value={plant} onValueChange={setPlant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plantOptions.map((opt) => (
                        <SelectItem key={opt} value={opt.toUpperCase()}>
                          {opt.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Tabs defaultValue="mqp" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="mqp">MQP ({mqpData.length})</TabsTrigger>
                  <TabsTrigger value="visual-el">
                    Visual & EL ({visualElData.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="mqp">{renderMQPTable()}</TabsContent>
                <TabsContent value="visual-el">{renderVisualElTable()}</TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Allocate each mismatch to:
              </h3>
              {Object.entries(assignments).map(([sno, alloc]) => {
                const item =
                  mqpData.find((q) => q.sno === +sno) ||
                  visualElData.find((q) => q.sno === +sno)!;
                return (
                  <div key={sno} className="p-4 border rounded">
                    <p className="font-medium">
                      S.No {sno}: {item.subCriteria}
                    </p>
                    <div className="flex gap-4 mt-2">
                      {(["production","quality","technical"] as const).map((role) => (
                        <label key={role} className="inline-flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={alloc[role]}
                            onChange={(e) =>
                              setAssignments((prev) => ({
                                ...prev,
                                [+sno]: {
                                  ...prev[+sno],
                                  [role]: e.target.checked,
                                },
                              }))
                            }
                          />
                          <span className="capitalize">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 pt-0 border-t bg-gray-50">
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            {step === "form" ? (
              <Button
                onClick={() => {
                  const unmatched = [...mqpData, ...visualElData].filter(
                    (i) => i.match === "no"
                  );
                  const init: Record<
                    number,
                    { production: boolean; quality: boolean; technical: boolean }
                  > = {};
                  unmatched.forEach((i) => {
                    init[i.sno] = {
                      production: false,
                      quality: false,
                      technical: false,
                    };
                  });
                  setAssignments(init);
                  setStep("assignments");
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button onClick={() => handleSave(false)} className="bg-green-600 hover:bg-green-700">
                Submit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedQAPModal;
