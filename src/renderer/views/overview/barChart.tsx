
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import {itemCategories} from 'renderer/components/content/shared/categories';
import Chart from 'chart.js/auto';
Chart


export default function BarApp() {
  let categoriesFixed: Array<string> = [];

  let resultingData = {} as any;
  itemCategories.forEach((element) => {
    categoriesFixed.push(element.name);
    resultingData[element.name] = {
      inventory: 0,
      storageUnits: 0
    }
  });

  // Radar options
  const options = {
    parsing: {
      key: 'nested.value',
    },
    legend: {
      position: 'top',
      labels: {
        fontColor: 'white',
      },
    },
    plugins: {
      title: {
          display: true,
          text: 'Items distribution'
      }
  },
    scales: {
      x: { ticks: { maxTicksLimit: 20 } },
      y: { min: 0, max: 100, ticks: { maxTicksLimit: 11 } },
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)',
        },

        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: 'white',
          showLabelBackdrop: false,
        },
      },
    },
  };

  // Go through inventory and find matching categories
  const inventory = useSelector((state: any) => state.inventoryReducer);
  const combined = Array.isArray(inventory?.combinedInventory) ? inventory.combinedInventory : [];
  const storageInv = Array.isArray(inventory?.storageInventory) ? inventory.storageInventory : [];
  combined.forEach((element: any) => {
    if (resultingData[element.category]) {
      resultingData[element.category].inventory = (resultingData[element.category]?.inventory || 0) + (Number.isFinite(Number(element.combined_QTY)) ? Number(element.combined_QTY) : 0)
    }
  });

  // Go through Storage Units
  storageInv.forEach((element: any) => {
    if (resultingData[element.category]) {
      resultingData[element.category].storageUnits = (resultingData[element.category]?.storageUnits || 0) + (Number.isFinite(Number(element.combined_QTY)) ? Number(element.combined_QTY) : 0)
    }
  });

  // Convert inventory to chart data
  const safeNum = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  let inventoryDataToUse: Array<number> = [];
  let storageUnitDataToUse: Array<number> = [];

  categoriesFixed.forEach(category => {
    inventoryDataToUse.push(safeNum(resultingData[category]?.inventory));
    storageUnitDataToUse.push(safeNum(resultingData[category]?.storageUnits));
  });


  const data = {
    labels: categoriesFixed,

    datasets: [
      {
        label: 'Inventory',
        data: inventoryDataToUse,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Storage Units',
        data: storageUnitDataToUse,
        backgroundColor: 'rgb(50, 91, 136, 0.2)',
        borderColor: 'rgb(50, 91, 136, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <Bar data={data} options={options} />
    </>
  );
}
