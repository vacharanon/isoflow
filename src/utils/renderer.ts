import { TILE_PROJECTION_MULTIPLIERS, UNPROJECTED_TILE_SIZE } from 'src/config';
import { Coords, TileOriginEnum, Node, Size, Scroll } from 'src/types';
import { CoordsUtils } from 'src/utils';

interface GetProjectedTileSize {
  zoom: number;
}

// Gets the size of a tile at a given zoom level
export const getProjectedTileSize = ({ zoom }: GetProjectedTileSize): Size => {
  return {
    width: UNPROJECTED_TILE_SIZE * TILE_PROJECTION_MULTIPLIERS.width * zoom,
    height: UNPROJECTED_TILE_SIZE * TILE_PROJECTION_MULTIPLIERS.height * zoom
  };
};

interface ScreenToIso {
  mouse: Coords;
  zoom: number;
  scroll: Scroll;
}

// converts a mouse position to a tile position
export const screenToIso = ({ mouse, zoom, scroll }: ScreenToIso) => {
  const editorWidth = window.innerWidth;
  const editorHeight = window.innerHeight;
  const projectedTileSize = getProjectedTileSize({ zoom });
  const halfW = projectedTileSize.width / 2;
  const halfH = projectedTileSize.height / 2;

  // The origin is the center of the project.
  const projectPosition = {
    x: mouse.x - scroll.position.x - editorWidth * 0.5,
    y: mouse.y - scroll.position.y - editorHeight * 0.5
  };

  const tile = {
    x: Math.floor(
      (projectPosition.x + halfW) / projectedTileSize.width -
        projectPosition.y / projectedTileSize.height
    ),
    y: -Math.floor(
      (projectPosition.y + halfH) / projectedTileSize.height +
        projectPosition.x / projectedTileSize.width
    )
  };

  return tile;
};

interface GetTilePosition {
  tile: Coords;
  scroll: Scroll;
  zoom: number;
  origin?: TileOriginEnum;
}

export const getTilePosition = ({
  tile,
  scroll,
  zoom,
  origin = TileOriginEnum.CENTER
}: GetTilePosition) => {
  // TODO: Refactor editorWidth to not use window width
  const editorWidth = window.innerWidth;
  const editorHeight = window.innerHeight;
  const projectedTileSize = getProjectedTileSize({ zoom });
  const halfW = projectedTileSize.width / 2;
  const halfH = projectedTileSize.height / 2;

  const position: Coords = {
    x:
      editorWidth * 0.5 + (halfW * tile.x - halfW * tile.y) + scroll.position.x,
    y:
      editorHeight * 0.5 - (halfH * tile.x + halfH * tile.y) + scroll.position.y
  };

  switch (origin) {
    case TileOriginEnum.TOP:
      return CoordsUtils.add(position, { x: 0, y: -halfH });
    case TileOriginEnum.BOTTOM:
      return CoordsUtils.add(position, { x: 0, y: halfH });
    case TileOriginEnum.LEFT:
      return CoordsUtils.add(position, { x: -halfW, y: 0 });
    case TileOriginEnum.RIGHT:
      return CoordsUtils.add(position, { x: halfW, y: 0 });
    case TileOriginEnum.CENTER:
    default:
      return position;
  }
};

export const sortByPosition = (tiles: Coords[]) => {
  const xSorted = [...tiles];
  const ySorted = [...tiles];
  xSorted.sort((a, b) => {
    return a.x - b.x;
  });
  ySorted.sort((a, b) => {
    return a.y - b.y;
  });

  const highest = {
    byX: xSorted[xSorted.length - 1],
    byY: ySorted[ySorted.length - 1]
  };
  const lowest = { byX: xSorted[0], byY: ySorted[0] };

  const lowX = lowest.byX.x;
  const highX = highest.byX.x;
  const lowY = lowest.byY.y;
  const highY = highest.byY.y;

  return {
    byX: xSorted,
    byY: ySorted,
    highest,
    lowest,
    lowX,
    lowY,
    highX,
    highY
  };
};

// Returns a complete set of tiles that form a grid area (takes in any number of tiles to use points to encapsulate)
export const getGridSubset = (tiles: Coords[]) => {
  const { lowX, lowY, highX, highY } = sortByPosition(tiles);

  const subset = [];

  for (let x = lowX; x < highX + 1; x += 1) {
    for (let y = lowY; y < highY + 1; y += 1) {
      subset.push({ x, y });
    }
  }

  return subset;
};

export const isWithinBounds = (tile: Coords, bounds: Coords[]) => {
  const { lowX, lowY, highX, highY } = sortByPosition(bounds);

  return tile.x >= lowX && tile.x <= highX && tile.y >= lowY && tile.y <= highY;
};

// Returns the four corners of a grid that encapsulates all tiles
// passed in (at least 1 tile needed)
export const getBoundingBox = (
  tiles: Coords[],
  offset: Coords = CoordsUtils.zero()
): Coords[] => {
  const { lowX, lowY, highX, highY } = sortByPosition(tiles);

  return [
    { x: lowX - offset.x, y: lowY - offset.y },
    { x: highX + offset.x, y: lowY - offset.y },
    { x: highX + offset.x, y: highY + offset.y },
    { x: lowX - offset.x, y: highY + offset.y }
  ];
};

export const getBoundingBoxSize = (boundingBox: Coords[]): Size => {
  const { lowX, lowY, highX, highY } = sortByPosition(boundingBox);

  return {
    width: highX - lowX + 1,
    height: highY - lowY + 1
  };
};

export const getIsoMatrixCSS = () => {
  return `matrix(-0.707, 0.409, 0.707, 0.409, 0, -0.816)`;
};

export const getTranslateCSS = (translate: Coords = { x: 0, y: 0 }) => {
  return `translate(${translate.x}px, ${translate.y}px)`;
};

interface GetNodesByTile {
  tile: Coords;
  nodes: Node[];
}

export const filterNodesByTile = ({ tile, nodes }: GetNodesByTile): Node[] => {
  return nodes.filter((node) => {
    return CoordsUtils.isEqual(node.position, tile);
  });
};