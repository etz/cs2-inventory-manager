
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import {itemSubCategories} from 'renderer/components/content/shared/categories';
import Chart from 'chart.js/auto';
Chart


export default function BarAppMajor() {

  // Bar options
  // @ts-ignore
  const options = {
    plugins: {
      legend: {
        labels: {
          color: '#d6d3cd',
        },

      },
      title: {
          display: true,
          text: 'Majors',
          color: '#d6d3cd'
      }
  },
    scales: {
      y: { min: 0, max: 100, ticks: { maxTicksLimit: 11 } },
      x: { ticks: { maxTicksLimit: 20 } },
    },
  };

  // Go through inventory and find matching categories
  const inventory = useSelector((state: any) => state.inventoryReducer);
  const combined = Array.isArray(inventory?.combinedInventory) ? inventory.combinedInventory : [];
  const storageInv = Array.isArray(inventory?.storageInventory) ? inventory.storageInventory : [];

  const safeNum = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  let inventoryDataToUse: Array<number> = [];
  let storageUnitDataToUse: Array<number> = [];

  Object.keys(itemSubCategories.majors).forEach(category => {
    const inventoryResult = combined.filter((itemRow: any) => itemRow.major == category);
    const storageResult = storageInv.filter((itemRow: any) => itemRow.major == category);
    let categoryCounter = 0;
    inventoryResult.forEach((element: any) => {
      categoryCounter += safeNum(element.combined_QTY);
    });
    let storageCounter = 0;
    storageResult.forEach((element: any) => {
      storageCounter += safeNum(element.combined_QTY);
    });
    inventoryDataToUse.push(categoryCounter);
    storageUnitDataToUse.push(storageCounter);
  });

  const data = {
    labels: Object.keys(itemSubCategories.majors),

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
// @ts-ignore
  return (
    <>

      <Bar data={data} options={options} />
    </>
  );
}
