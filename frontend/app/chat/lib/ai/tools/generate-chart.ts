import { z } from 'zod';
import { tool } from 'ai';

const generateChartParameters = z.object({
  chartType: z
    .enum(['bar', 'line', 'pie'])
    .describe('The type of chart to generate.'),
  data: z
    .array(
      z.object({
        label: z.string().describe('The label for a data point.'),
        value: z.number().describe('The value for a data point.'),
      }),
    )
    .describe('The data for the chart, as an array of objects.'),
  xAxis: z
    .string()
    .describe(
      "The key from the data objects to use for the X-axis. This must be 'label'.",
    ),
  yAxis: z
    .array(z.string())
    .describe(
      "The key(s) from the data objects to use for the Y-axis. This must be 'value'.",
    ),
  title: z.string().optional().describe('The title of the chart.'),
  description: z.string().optional().describe('A description of the chart.'),
});

export const generateChart = tool({
  description: 'Generate a chart for data visualization. Use this to display data in a graphical format.',
  parameters: generateChartParameters,
  execute: async (args: z.infer<typeof generateChartParameters>) => {
    // This tool doesn't perform a server-side action.
    // It returns its arguments so the UI can render the chart.
    return args;
  },
});
