import { Response } from 'express';
import { Card } from './GraphCards';
import { invalidUserSvg } from './svgs';
import { selectColors } from './styles/themes';
import { queryOption, ParsedQs, UserDetails } from './interfaces/interface';

export class Utilities {
    username: string;
    constructor(private readonly queryString: ParsedQs) {
        this.username = String(this.queryString.username);
    }

    private getColors() {
        const theme = this.queryString.theme || 'default';
        return {
            areaColor: this.queryString.area_color
                ? this.queryString.area_color
                : selectColors(theme).areaColor,
            bgColor: this.queryString.bg_color
                ? this.queryString.bg_color
                : selectColors(theme).bgColor,
            borderColor:
                String(this.queryString.hide_border) === 'true'
                    ? '0000' // transparent
                    : selectColors(theme).borderColor,
            color: this.queryString.color ? this.queryString.color : selectColors(theme).color,
            lineColor: this.queryString.line
                ? this.queryString.line
                : selectColors(theme).lineColor,
            pointColor: this.queryString.point
                ? this.queryString.point
                : selectColors(theme).pointColor,
        };
    }

    public queryOptions() {
        let area = false;
        if (String(this.queryString.area) === 'true') {
            area = true;
        }

        // Custom options for user
        const colors = this.getColors();

        const options: queryOption = {
            username: this.username,
            hide_title: String(this.queryString.hide_title) === 'true' ? true : false,
            colors: colors,
            area: area,
        };

        if (this.queryString.custom_title)
            options['custom_title'] = String(this.queryString.custom_title);

        return options;
    }

    public async buildGraph(fetchCalendarData: string | UserDetails) {
        if (typeof fetchCalendarData === 'object') {
            const options = this.queryOptions();
            let title = '';

            if (!options.hide_title) {
                if (options.custom_title) {
                    title = options.custom_title;
                } else {
                    title = `${
                        fetchCalendarData.name !== null ? fetchCalendarData.name : options.username
                    }'s Contribution Graph`;
                }
            }

            const graph: Card = new Card(420, 1200, options.colors, title, options.area);

            const getChart: string = await graph.buildGraph(fetchCalendarData.contributions);

            return {
                finalGraph: getChart,
                header: {
                    maxAge: 'public, max-age=1800',
                },
            };
        } else {
            return {
                finalGraph: invalidUserSvg(fetchCalendarData),
                header: { maxAge: 'no-store, max-age=0' },
            };
        }
    }

    public setHttpHeader(res: Response, directivesAndAge: string): void {
        res.setHeader('Cache-Control', `${directivesAndAge}`);
        res.set('Content-Type', 'image/svg+xml');
    }
}
